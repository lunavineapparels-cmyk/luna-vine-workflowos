import type { Env } from "../types";
import { id as newId } from "../core/ids";
import { audit } from "./audit";

type ReviewStatus = "NOT_STARTED" | "PASS" | "HOLD" | "FAIL" | "N_A";

function now() { return new Date().toISOString(); }
function csvToJson(value?: string): string {
  return JSON.stringify((value || "").split(",").map(v => v.trim()).filter(Boolean));
}

export async function createPsychographicSegment(env: Env, input: {
  name: string; description?: string; lifecycleStage?: string; values?: string; desires?: string;
  frustrations?: string; triggers?: string; objections?: string; preferredTone?: string; avoid?: string;
  actorEmail: string;
}) {
  const id = newId("SEG"); const ts = now();
  await env.DB.prepare(`INSERT INTO psychographic_segments
    (id,name,description,lifecycle_stage,values_json,desires_json,frustrations_json,triggers_json,objections_json,preferred_tone_json,avoid_json,evidence_quality,status,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,'HYPOTHESIS','DRAFT',?,?,?)`)
    .bind(id,input.name,input.description||null,input.lifecycleStage||null,csvToJson(input.values),csvToJson(input.desires),csvToJson(input.frustrations),csvToJson(input.triggers),csvToJson(input.objections),csvToJson(input.preferredTone),csvToJson(input.avoid),input.actorEmail,ts,ts).run();
  await audit(env,{actorEmail:input.actorEmail,action:"PSYCHOGRAPHIC_SEGMENT_CREATED",objectType:"psychographic_segment",objectId:id,newValue:{name:input.name,status:"DRAFT"}});
  return {id};
}

export async function createMarketingHypothesis(env: Env, input: {
  title: string; problemStatement: string; proposedIntervention: string; primaryMetric: string;
  segmentId?: string; productId?: string; caseId?: string; models?: string; guardrails?: string;
  riskLevel?: string; legalRequired?: boolean; claimsRequired?: boolean; culturalRequired?: boolean; actorEmail: string;
}) {
  const id = newId("MKT"); const ts = now();
  await env.DB.prepare(`INSERT INTO marketing_hypotheses
    (id,case_id,product_id,segment_id,title,problem_statement,proposed_intervention,behavioral_models_json,primary_metric,guardrails_json,status,risk_level,ethics_status,brand_status,legal_status,claims_status,cultural_status,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,'DRAFT',?,'NOT_STARTED','NOT_STARTED',?,?,?, ?,?,?)`)
    .bind(id,input.caseId||null,input.productId||null,input.segmentId||null,input.title,input.problemStatement,input.proposedIntervention,csvToJson(input.models),input.primaryMetric,csvToJson(input.guardrails),input.riskLevel||"MEDIUM",input.legalRequired?"NOT_STARTED":"N_A",input.claimsRequired?"NOT_STARTED":"N_A",input.culturalRequired?"NOT_STARTED":"N_A",input.actorEmail,ts,ts).run();
  await audit(env,{actorEmail:input.actorEmail,action:"MARKETING_HYPOTHESIS_CREATED",objectType:"marketing_hypothesis",objectId:id,newValue:{title:input.title,status:"DRAFT"}});
  return {id};
}

export function evaluateMarketingReadiness(h: {
  ethics_status: ReviewStatus; brand_status: ReviewStatus; legal_status: ReviewStatus;
  claims_status: ReviewStatus; cultural_status: ReviewStatus;
}) {
  const required = [h.ethics_status,h.brand_status,h.legal_status,h.claims_status,h.cultural_status].filter(v=>v!=="N_A");
  if (required.some(v=>v==="FAIL")) return "REJECTED";
  if (required.some(v=>v==="HOLD")) return "HOLD";
  if (required.some(v=>v!=="PASS")) return "REVIEW_REQUIRED";
  return "READY_TO_TEST";
}

export async function setMarketingReview(env: Env, input: {
  hypothesisId: string; dimension: "ethics"|"brand"|"legal"|"claims"|"cultural";
  result: ReviewStatus; reviewerRole: string; rationale: string; score?: number; riskFlags?: string; actorEmail: string;
}) {
  const column = `${input.dimension}_status`;
  const allowed = new Set(["ethics_status","brand_status","legal_status","claims_status","cultural_status"]);
  if (!allowed.has(column)) throw new Error("Invalid review dimension");
  const before = await env.DB.prepare(`SELECT * FROM marketing_hypotheses WHERE id=?`).bind(input.hypothesisId).first<any>();
  if (!before) throw new Error("Marketing hypothesis not found");
  const ts=now();
  await env.DB.prepare(`UPDATE marketing_hypotheses SET ${column}=?, updated_at=? WHERE id=?`).bind(input.result,ts,input.hypothesisId).run();
  await env.DB.prepare(`INSERT INTO marketing_council_reviews
    (id,hypothesis_id,reviewer_role,reviewer_type,verdict,score,rationale,risk_flags_json,reviewer_email,created_at)
    VALUES (?,?,?,'HUMAN_OR_AI',?,?,?,?,?,?)`)
    .bind(newId("MCR"),input.hypothesisId,input.reviewerRole,input.result,input.score??null,input.rationale,csvToJson(input.riskFlags),input.actorEmail,ts).run();
  const after = await env.DB.prepare(`SELECT * FROM marketing_hypotheses WHERE id=?`).bind(input.hypothesisId).first<any>();
  const readiness=evaluateMarketingReadiness(after);
  await env.DB.prepare(`UPDATE marketing_hypotheses SET status=?, updated_at=? WHERE id=?`).bind(readiness,ts,input.hypothesisId).run();
  await audit(env,{actorEmail:input.actorEmail,action:"MARKETING_COUNCIL_REVIEW",objectType:"marketing_hypothesis",objectId:input.hypothesisId,reason:input.rationale,oldValue:{status:before.status,[column]:before[column]},newValue:{status:readiness,[column]:input.result}});
  return {status:readiness};
}

export async function createMarketingExperiment(env: Env, input: {
  hypothesisId: string; channel: string; audienceDescription?: string; control: string; variant: string;
  primaryMetric: string; guardrails?: string; actorEmail: string;
}) {
  const h=await env.DB.prepare(`SELECT * FROM marketing_hypotheses WHERE id=?`).bind(input.hypothesisId).first<any>();
  if(!h) throw new Error("Marketing hypothesis not found");
  const readiness=evaluateMarketingReadiness(h);
  if(readiness!=="READY_TO_TEST") throw new Error(`Hypothesis is ${readiness}; all required reviews must PASS before an experiment is created.`);
  const id=newId("EXP"); const ts=now();
  await env.DB.prepare(`INSERT INTO marketing_experiments
    (id,hypothesis_id,channel,audience_description,control_json,variant_json,primary_metric,guardrails_json,status,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?, 'DRAFT',?,?,?)`)
    .bind(id,input.hypothesisId,input.channel,input.audienceDescription||null,JSON.stringify({copy:input.control}),JSON.stringify({copy:input.variant}),input.primaryMetric,csvToJson(input.guardrails),input.actorEmail,ts,ts).run();
  await audit(env,{actorEmail:input.actorEmail,action:"MARKETING_EXPERIMENT_CREATED",objectType:"marketing_experiment",objectId:id,newValue:{hypothesisId:input.hypothesisId,channel:input.channel,status:"DRAFT"}});
  return {id};
}

export async function startMarketingExperiment(env: Env, input:{experimentId:string; actorEmail:string}) {
  const before=await env.DB.prepare(`SELECT * FROM marketing_experiments WHERE id=?`).bind(input.experimentId).first<any>();
  if(!before) throw new Error("Marketing experiment not found");
  if(before.status!=="DRAFT") throw new Error(`Experiment cannot start from ${before.status}`);
  const ts=now();
  await env.DB.prepare(`UPDATE marketing_experiments SET status='RUNNING',started_at=?,updated_at=? WHERE id=?`).bind(ts,ts,input.experimentId).run();
  await audit(env,{actorEmail:input.actorEmail,action:"MARKETING_EXPERIMENT_STARTED",objectType:"marketing_experiment",objectId:input.experimentId,oldValue:{status:before.status},newValue:{status:"RUNNING",startedAt:ts}});
}

export async function completeMarketingExperiment(env: Env, input:{
  experimentId:string; sampleSize?:number; resultsSummary:string; decision:"WIN"|"LOSS"|"INCONCLUSIVE"|"STOPPED";
  learning?:string; confidence?:string; evidenceQuality?:string; applicability?:string; actorEmail:string;
}) {
  const before=await env.DB.prepare(`SELECT * FROM marketing_experiments WHERE id=?`).bind(input.experimentId).first<any>();
  if(!before) throw new Error("Marketing experiment not found");
  if(!["DRAFT","RUNNING"].includes(before.status)) throw new Error(`Experiment cannot complete from ${before.status}`);
  const ts=now();
  await env.DB.prepare(`UPDATE marketing_experiments SET status='COMPLETED',ended_at=?,sample_size=?,results_json=?,decision=?,updated_at=? WHERE id=?`)
    .bind(ts,input.sampleSize??null,JSON.stringify({summary:input.resultsSummary}),input.decision,ts,input.experimentId).run();
  let learningId:string|undefined;
  if(input.learning?.trim()) {
    learningId=newId("LRN");
    await env.DB.prepare(`INSERT INTO marketing_learning_registry
      (id,hypothesis_id,experiment_id,learning,confidence,evidence_quality,reusable,applicability,created_at)
      VALUES (?,?,?,?,?,?,0,?,?)`)
      .bind(learningId,before.hypothesis_id,input.experimentId,input.learning.trim(),input.confidence||"LOW",input.evidenceQuality||"EXPERIMENT",input.applicability||null,ts).run();
  }
  await audit(env,{actorEmail:input.actorEmail,action:"MARKETING_EXPERIMENT_COMPLETED",objectType:"marketing_experiment",objectId:input.experimentId,oldValue:{status:before.status},newValue:{status:"COMPLETED",decision:input.decision,sampleSize:input.sampleSize,learningId}});
  return {learningId};
}

export async function approveMarketingLearning(env:Env,input:{learningId:string; actorEmail:string}) {
  const before=await env.DB.prepare(`SELECT * FROM marketing_learning_registry WHERE id=?`).bind(input.learningId).first<any>();
  if(!before) throw new Error("Marketing learning not found");
  const ts=now();
  await env.DB.prepare(`UPDATE marketing_learning_registry SET reusable=1,approved_by=?,approved_at=? WHERE id=?`).bind(input.actorEmail,ts,input.learningId).run();
  await audit(env,{actorEmail:input.actorEmail,action:"MARKETING_LEARNING_APPROVED",objectType:"marketing_learning",objectId:input.learningId,oldValue:{reusable:before.reusable},newValue:{reusable:1,approvedBy:input.actorEmail}});
}
