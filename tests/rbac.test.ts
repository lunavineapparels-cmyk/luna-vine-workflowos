import test from "node:test";
import assert from "node:assert/strict";
import { gateReviewPermission } from "../src/services/auth";

test("routes sensitive release gates to the correct permission families", () => {
  assert.equal(gateReviewPermission("LEGAL_IP"), "gate.review.legal");
  assert.equal(gateReviewPermission("CLAIMS_EVIDENCE"), "gate.review.legal");
  assert.equal(gateReviewPermission("PRICING_MARGIN"), "gate.review.finance");
  assert.equal(gateReviewPermission("PRODUCTION_PREFLIGHT"), "gate.review.production");
  assert.equal(gateReviewPermission("PLATFORM_READINESS"), "gate.review.marketplace");
  assert.equal(gateReviewPermission("FINAL_HUMAN_REVIEW"), "release.final_approve");
  assert.equal(gateReviewPermission("BRAND_CREATIVE"), "gate.review.brand");
});
