import type { Env } from "../types";
import { id } from "../core/ids";

export async function audit(
  env: Env,
  input: {
    actorEmail: string;
    action: string;
    objectType: string;
    objectId: string;
    reason?: string;
    oldValue?: unknown;
    newValue?: unknown;
    correlationId?: string;
  },
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO audit_events
      (id, actor_email, action, object_type, object_id, reason, old_json, new_json, correlation_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `)
    .bind(
      id("audit"),
      input.actorEmail,
      input.action,
      input.objectType,
      input.objectId,
      input.reason ?? null,
      input.oldValue === undefined ? null : JSON.stringify(input.oldValue),
      input.newValue === undefined ? null : JSON.stringify(input.newValue),
      input.correlationId ?? null,
    )
    .run();
}
