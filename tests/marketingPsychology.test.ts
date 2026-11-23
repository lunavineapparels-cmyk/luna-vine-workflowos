import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMarketingReadiness } from "../src/services/marketingPsychology";

test("marketing psychology requires brand and ethics pass",()=>{
  assert.equal(evaluateMarketingReadiness({ethics_status:"PASS",brand_status:"NOT_STARTED",legal_status:"N_A",claims_status:"N_A",cultural_status:"N_A"}),"REVIEW_REQUIRED");
});

test("applicable review failure rejects the hypothesis",()=>{
  assert.equal(evaluateMarketingReadiness({ethics_status:"PASS",brand_status:"PASS",legal_status:"FAIL",claims_status:"N_A",cultural_status:"N_A"}),"REJECTED");
});

test("hold blocks experimentation",()=>{
  assert.equal(evaluateMarketingReadiness({ethics_status:"HOLD",brand_status:"PASS",legal_status:"N_A",claims_status:"N_A",cultural_status:"N_A"}),"HOLD");
});

test("all applicable reviews pass before READY_TO_TEST",()=>{
  assert.equal(evaluateMarketingReadiness({ethics_status:"PASS",brand_status:"PASS",legal_status:"PASS",claims_status:"PASS",cultural_status:"N_A"}),"READY_TO_TEST");
});
