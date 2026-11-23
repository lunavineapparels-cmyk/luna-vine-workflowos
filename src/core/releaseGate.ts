import type { GateEvaluationInput, ReleaseDecision } from "../types";

export interface ReleaseEvaluation {
  decision: ReleaseDecision;
  blockers: string[];
  failed: string[];
  incomplete: string[];
  passed: number;
  totalBlocking: number;
}

export function evaluateRelease(gates: GateEvaluationInput[]): ReleaseEvaluation {
  const blocking = gates.filter((g) => g.blocking && g.result !== "N_A");
  const failed = blocking.filter((g) => g.result === "FAIL").map((g) => g.code);
  const blockers = blocking.filter((g) => g.result === "HOLD").map((g) => g.code);
  const incomplete = blocking
    .filter((g) => g.result === "NOT_STARTED")
    .map((g) => g.code);
  const passed = blocking.filter((g) => g.result === "PASS").length;

  let decision: ReleaseDecision = "RELEASE_READY";
  if (failed.length > 0) {
    const criticalFailure = blocking.some(
      (g) => g.result === "FAIL" && g.riskSeverity === "CRITICAL",
    );
    decision = criticalFailure ? "ESCALATE" : "REVISE";
  } else if (blockers.length > 0 || incomplete.length > 0) {
    decision = "HOLD";
  }

  return {
    decision,
    blockers,
    failed,
    incomplete,
    passed,
    totalBlocking: blocking.length,
  };
}
