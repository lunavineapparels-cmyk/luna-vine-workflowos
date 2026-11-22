import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";
import type { Env } from "../types";

interface ProductReleaseParams {
  caseId: string;
  actorEmail: string;
}

export class ProductReleaseWorkflow extends WorkflowEntrypoint<Env, ProductReleaseParams> {
  async run(event: WorkflowEvent<ProductReleaseParams>, step: WorkflowStep) {
    const { caseId } = event.payload;

    await step.do("mark workflow in progress", async () => {
      await this.env.DB.prepare(`UPDATE workflow_cases SET status='IN_PROGRESS', stage='GOVERNANCE_REVIEW', updated_at=datetime('now') WHERE id=?`).bind(caseId).run();
      return { caseId };
    });

    const gateSnapshot = await step.do("load gate snapshot", async () => {
      const rows = await this.env.DB.prepare(`SELECT gd.code,cg.result FROM case_gates cg JOIN gate_definitions gd ON gd.id=cg.gate_definition_id WHERE cg.case_id=? AND cg.required=1`).bind(caseId).all<{code:string;result:string}>();
      return rows.results;
    });

    const complete = gateSnapshot.length > 0 && gateSnapshot.every((g) => g.result === "PASS" || g.result === "N_A");

    await step.do("set verification stage", async () => {
      await this.env.DB.prepare(`UPDATE workflow_cases SET stage=?, status=?, updated_at=datetime('now') WHERE id=?`).bind(complete ? "FINAL_RELEASE_REVIEW" : "GATE_COMPLETION", complete ? "VERIFICATION" : "IN_PROGRESS", caseId).run();
      return { complete };
    });

    return { caseId, complete, gates: gateSnapshot.length };
  }
}
