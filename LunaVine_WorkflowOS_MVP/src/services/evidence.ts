import type { Env } from "../types";
import { id } from "../core/ids";
import { audit } from "./audit";

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function storeEvidence(
  env: Env,
  input: {
    file: File;
    caseId: string;
    evidenceType: string;
    actorEmail: string;
    source?: string;
  },
) {
  const evidenceId = id("ev");
  const data = await input.file.arrayBuffer();
  const checksum = await sha256(data);
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `cases/${input.caseId}/${evidenceId}/${safeName}`;

  await env.EVIDENCE.put(key, data, {
    httpMetadata: { contentType: input.file.type || "application/octet-stream" },
    customMetadata: {
      evidenceId,
      caseId: input.caseId,
      checksum,
      uploadedBy: input.actorEmail,
    },
  });

  await env.DB.prepare(`
    INSERT INTO evidence
      (id, case_id, evidence_type, source, file_name, object_key, mime_type, size_bytes, checksum_sha256, owner_email, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
  `).bind(
    evidenceId,
    input.caseId,
    input.evidenceType,
    input.source ?? "UPLOAD",
    input.file.name,
    key,
    input.file.type || "application/octet-stream",
    input.file.size,
    checksum,
    input.actorEmail,
  ).run();

  await audit(env, {
    actorEmail: input.actorEmail,
    action: "EVIDENCE_STORED",
    objectType: "EVIDENCE",
    objectId: evidenceId,
    newValue: { caseId: input.caseId, evidenceType: input.evidenceType, checksum, objectKey: key },
    correlationId: input.caseId,
  });

  return { id: evidenceId, key, checksum };
}
