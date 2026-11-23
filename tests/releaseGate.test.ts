import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRelease } from "../src/core/releaseGate";

test("all blocking gates pass => RELEASE_READY", () => {
  const result = evaluateRelease([
    { code: "LEGAL_IP", blocking: true, result: "PASS", riskSeverity: "CRITICAL" },
    { code: "SAMPLE_QA", blocking: true, result: "PASS", riskSeverity: "CRITICAL" },
  ]);
  assert.equal(result.decision, "RELEASE_READY");
});

test("incomplete blocking gate => HOLD", () => {
  const result = evaluateRelease([
    { code: "LEGAL_IP", blocking: true, result: "PASS", riskSeverity: "CRITICAL" },
    { code: "SAMPLE_QA", blocking: true, result: "NOT_STARTED", riskSeverity: "CRITICAL" },
  ]);
  assert.equal(result.decision, "HOLD");
  assert.deepEqual(result.incomplete, ["SAMPLE_QA"]);
});

test("critical failure => ESCALATE", () => {
  const result = evaluateRelease([
    { code: "LEGAL_IP", blocking: true, result: "FAIL", riskSeverity: "CRITICAL" },
  ]);
  assert.equal(result.decision, "ESCALATE");
});

test("N/A gate is not counted as blocking", () => {
  const result = evaluateRelease([
    { code: "CULTURAL_REVIEW", blocking: true, result: "N_A", riskSeverity: "HIGH" },
    { code: "LEGAL_IP", blocking: true, result: "PASS", riskSeverity: "CRITICAL" },
  ]);
  assert.equal(result.decision, "RELEASE_READY");
  assert.equal(result.totalBlocking, 1);
});
