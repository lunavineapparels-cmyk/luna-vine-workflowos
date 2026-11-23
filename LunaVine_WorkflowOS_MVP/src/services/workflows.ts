import type { Env, GateEvaluationInput } from "../types";
import { id } from "../core/ids";
import { evaluateRelease } from "../core/releaseGate";
import { audit } from "./audit";

export async function createProductReleaseCase(
  env: Env,
  input: { title: string; actorEmail: string; riskLevel?: string; productId?: string },
) {
  const caseId = id("case");
  await env.DB.prepare(`
    INSERT INTO workflow_cases
      (id, workflow_type, workflow_version, title, accountable_email, status, stage, priority, risk_level, product_id, created_at, updated_at)
    VALUES (?, 'PRODUCT_RELEASE', '1.0', ?, ?, 'DRAFT', 'INTAKE', 'NORMAL', ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(caseId, input.title, input.actorEmail, input.riskLevel ?? "MEDIUM", input.productId ?? null)
    .run();

  const gates = await env.DB.prepare(`
    SELECT id, code FROM gate_definitions WHERE active = 1 AND default_required = 1
  `).all<{ id: string; code: string }>();

  for (const gate of gates.results) {
    await env.DB.prepare(`
      INSERT INTO case_gates (id, case_id, gate_definition_id, result, required, created_at, updated_at)
      VALUES (?, ?, ?, 'NOT_STARTED', 1, datetime('now'), datetime('now'))
    `).bind(id("cg"), caseId, gate.id).run();
  }

  await audit(env, {
    actorEmail: input.actorEmail,
    action: "WORKFLOW_CASE_CREATED",
    objectType: "WORKFLOW_CASE",
    objectId: caseId,
    newValue: { workflowType: "PRODUCT_RELEASE", title: input.title },
    correlationId: caseId,
  });

  return { id: caseId };
}

export async function setGateResult(
  env: Env,
  input: { caseId: string; gateCode: string; result: string; actorEmail: string; notes?: string },
) {
  const gate = await env.DB.prepare(`
    SELECT cg.id, cg.result AS old_result, gd.id AS gate_id
    FROM case_gates cg
    JOIN gate_definitions gd ON gd.id = cg.gate_definition_id
    WHERE cg.case_id = ? AND gd.code = ?
  `).bind(input.caseId, input.gateCode).first<{ id: string; old_result: string; gate_id: string }>();

  if (!gate) throw new Response("Gate not found for case", { status: 404 });

  await env.DB.prepare(`
    UPDATE case_gates
    SET result = ?, reviewer_email = ?, notes = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(input.result, input.actorEmail, input.notes ?? null, gate.id).run();

  await audit(env, {
    actorEmail: input.actorEmail,
    action: "GATE_RESULT_CHANGED",
    objectType: "CASE_GATE",
    objectId: gate.id,
    oldValue: { result: gate.old_result },
    newValue: { result: input.result, notes: input.notes ?? null },
    correlationId: input.caseId,
  });
}

export async function calculateCaseRelease(env: Env, caseId: string, actorEmail: string) {
  const rows = await env.DB.prepare(`
    SELECT gd.code, gd.blocking, gd.risk_severity, cg.result
    FROM case_gates cg
    JOIN gate_definitions gd ON gd.id = cg.gate_definition_id
    WHERE cg.case_id = ? AND cg.required = 1
  `).bind(caseId).all<{ code: string; blocking: number; risk_severity: GateEvaluationInput["riskSeverity"]; result: GateEvaluationInput["result"] }>();

  const evaluation = evaluateRelease(rows.results.map((r) => ({
    code: r.code,
    blocking: Boolean(r.blocking),
    riskSeverity: r.risk_severity,
    result: r.result,
  })));

  await env.DB.prepare(`
    UPDATE workflow_cases SET release_decision = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(evaluation.decision, caseId).run();

  await audit(env, {
    actorEmail,
    action: "RELEASE_GATE_EVALUATED",
    objectType: "WORKFLOW_CASE",
    objectId: caseId,
    newValue: evaluation,
    correlationId: caseId,
  });

  return evaluation;
}
