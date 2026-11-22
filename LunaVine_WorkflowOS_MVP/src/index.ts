import type { Env, MinimalExecutionContext } from "./types";
import { requireActor } from "./services/auth";
import { createProductReleaseCase, setGateResult, calculateCaseRelease } from "./services/workflows";
import { storeEvidence } from "./services/evidence";
import { createPsychographicSegment, createMarketingHypothesis, setMarketingReview, createMarketingExperiment, startMarketingExperiment, completeMarketingExperiment, approveMarketingLearning } from "./services/marketingPsychology";
import { dashboard, casesPage, newCasePage, caseDetail, genericTable, marketingPsychologyPage, newPsychographicSegmentPage, newMarketingHypothesisPage, marketingHypothesisDetail, marketingExperimentDetail } from "./ui/pages";
export { ProductReleaseWorkflow } from "./workflows/productRelease";

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}
function json(value: unknown, status=200): Response { return Response.json(value,{status}); }
async function formOrJson(request: Request): Promise<Record<string,string>> {
  const type=request.headers.get("content-type")||"";
  if(type.includes("application/json")) return (await request.json()) as Record<string,string>;
  const f=await request.formData(); const out:Record<string,string>={}; for(const [k,v] of f.entries()) if(typeof v==="string") out[k]=v; return out;
}

export default {
  async fetch(request: Request, env: Env, ctx: MinimalExecutionContext): Promise<Response> {
    try {
      const actor = await requireActor(env, ctx);
      const url = new URL(request.url);
      const p = url.pathname;

      if (request.method === "GET" && p === "/") return new Response(await dashboard(env, actor.email), { headers: { "content-type": "text/html; charset=utf-8" } });
      if (request.method === "GET" && p === "/cases") return new Response(await casesPage(env, actor.email), { headers: { "content-type": "text/html; charset=utf-8" } });
      if (request.method === "GET" && p === "/cases/new") return new Response(newCasePage(actor.email), { headers: { "content-type": "text/html; charset=utf-8" } });
      if (request.method === "GET" && p.startsWith("/cases/")) {
        const caseId = decodeURIComponent(p.split("/")[2] || "");
        return new Response(await caseDetail(env, actor.email, caseId), { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (request.method === "GET" && p === "/designs") return new Response(await genericTable(env,actor.email,"Designs","SELECT id,name,collection,status,artwork_version_id,updated_at FROM designs ORDER BY updated_at DESC",["id","name","collection","status","artwork_version_id","updated_at"]),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p === "/products") return new Response(await genericTable(env,actor.email,"Products","SELECT id,name,parent_sku,supplier,status,updated_at FROM products ORDER BY updated_at DESC",["id","name","parent_sku","supplier","status","updated_at"]),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p === "/evidence") return new Response(await genericTable(env,actor.email,"Evidence Vault","SELECT id,evidence_type,file_name,owner_email,status,created_at FROM evidence ORDER BY created_at DESC",["id","evidence_type","file_name","owner_email","status","created_at"]),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p === "/audit") return new Response(await genericTable(env,actor.email,"Audit Ledger","SELECT created_at,actor_email,action,object_type,object_id FROM audit_events ORDER BY created_at DESC LIMIT 200",["created_at","actor_email","action","object_type","object_id"]),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p === "/marketing-psychology") return new Response(await marketingPsychologyPage(env,actor.email),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p === "/marketing-psychology/segments/new") return new Response(newPsychographicSegmentPage(actor.email),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p === "/marketing-psychology/hypotheses/new") return new Response(await newMarketingHypothesisPage(env,actor.email),{headers:{"content-type":"text/html; charset=utf-8"}});
      const expDetail=p.match(/^\/marketing-psychology\/experiments\/([^/]+)$/);
      if(request.method==="GET"&&expDetail) return new Response(await marketingExperimentDetail(env,actor.email,decodeURIComponent(expDetail[1])),{headers:{"content-type":"text/html; charset=utf-8"}});
      if (request.method === "GET" && p.startsWith("/marketing-psychology/")) { const id=decodeURIComponent(p.split("/")[2]||""); return new Response(await marketingHypothesisDetail(env,actor.email,id),{headers:{"content-type":"text/html; charset=utf-8"}}); }


      if (request.method === "POST" && p === "/api/marketing/segments") {
        const body=await formOrJson(request); if(!body.name) return json({error:"name required"},400);
        await createPsychographicSegment(env,{name:body.name,description:body.description,lifecycleStage:body.lifecycleStage,values:body.values,desires:body.desires,frustrations:body.frustrations,triggers:body.triggers,objections:body.objections,preferredTone:body.preferredTone,avoid:body.avoid,actorEmail:actor.email}); return redirect("/marketing-psychology");
      }
      if (request.method === "POST" && p === "/api/marketing/hypotheses") {
        const body=await formOrJson(request);
        if(!body.title||!body.problemStatement||!body.proposedIntervention||!body.primaryMetric) return json({error:"title, problemStatement, proposedIntervention and primaryMetric required"},400);
        const created=await createMarketingHypothesis(env,{title:body.title,problemStatement:body.problemStatement,proposedIntervention:body.proposedIntervention,primaryMetric:body.primaryMetric,segmentId:body.segmentId||undefined,productId:body.productId||undefined,caseId:body.caseId||undefined,models:body.models,guardrails:body.guardrails,riskLevel:body.riskLevel,legalRequired:body.legalRequired==="true",claimsRequired:body.claimsRequired==="true",culturalRequired:body.culturalRequired==="true",actorEmail:actor.email});
        return redirect(`/marketing-psychology/${created.id}`);
      }
      const mktReview=p.match(/^\/api\/marketing\/hypotheses\/([^/]+)\/reviews$/);
      if(request.method==="POST"&&mktReview){const body=await formOrJson(request);await setMarketingReview(env,{hypothesisId:decodeURIComponent(mktReview[1]),dimension:body.dimension as any,result:body.result as any,reviewerRole:body.reviewerRole||"Council Reviewer",rationale:body.rationale||"",score:body.score?Number(body.score):undefined,riskFlags:body.riskFlags,actorEmail:actor.email});return redirect(`/marketing-psychology/${decodeURIComponent(mktReview[1])}`)}
      const mktExp=p.match(/^\/api\/marketing\/hypotheses\/([^/]+)\/experiments$/);
      if(request.method==="POST"&&mktExp){const body=await formOrJson(request);await createMarketingExperiment(env,{hypothesisId:decodeURIComponent(mktExp[1]),channel:body.channel,audienceDescription:body.audienceDescription,control:body.control,variant:body.variant,primaryMetric:body.primaryMetric,guardrails:body.guardrails,actorEmail:actor.email});return redirect(`/marketing-psychology/${decodeURIComponent(mktExp[1])}`)}
      const mktStart=p.match(/^\/api\/marketing\/experiments\/([^/]+)\/start$/);
      if(request.method==="POST"&&mktStart){await startMarketingExperiment(env,{experimentId:decodeURIComponent(mktStart[1]),actorEmail:actor.email});return redirect(`/marketing-psychology/experiments/${decodeURIComponent(mktStart[1])}`)}
      const mktComplete=p.match(/^\/api\/marketing\/experiments\/([^/]+)\/complete$/);
      if(request.method==="POST"&&mktComplete){const body=await formOrJson(request);await completeMarketingExperiment(env,{experimentId:decodeURIComponent(mktComplete[1]),sampleSize:body.sampleSize?Number(body.sampleSize):undefined,resultsSummary:body.resultsSummary,decision:body.decision as any,learning:body.learning,confidence:body.confidence,evidenceQuality:body.evidenceQuality,applicability:body.applicability,actorEmail:actor.email});return redirect(`/marketing-psychology/experiments/${decodeURIComponent(mktComplete[1])}`)}
      const learningApprove=p.match(/^\/api\/marketing\/learnings\/([^/]+)\/approve$/);
      if(request.method==="POST"&&learningApprove){await approveMarketingLearning(env,{learningId:decodeURIComponent(learningApprove[1]),actorEmail:actor.email});return redirect(request.headers.get("referer")||"/marketing-psychology")}

      if (request.method === "POST" && p === "/api/cases") {
        const body=await formOrJson(request); if(!body.title) return json({error:"title required"},400);
        const created=await createProductReleaseCase(env,{title:body.title,actorEmail:actor.email,riskLevel:body.riskLevel});
        const instance=await env.PRODUCT_RELEASE_WORKFLOW.create({id:`release-${created.id}`,params:{caseId:created.id,actorEmail:actor.email}});
        return request.headers.get("accept")?.includes("text/html") ? redirect(`/cases/${created.id}`) : json({...created,workflowInstanceId:instance.id},201);
      }

      const gateMatch=p.match(/^\/api\/cases\/([^/]+)\/gates\/([^/]+)$/);
      if(request.method==="POST"&&gateMatch){const body=await formOrJson(request);await setGateResult(env,{caseId:decodeURIComponent(gateMatch[1]),gateCode:decodeURIComponent(gateMatch[2]),result:body.result,notes:body.notes,actorEmail:actor.email});return redirect(`/cases/${decodeURIComponent(gateMatch[1])}`)}

      const evalMatch=p.match(/^\/api\/cases\/([^/]+)\/evaluate$/);
      if(request.method==="POST"&&evalMatch){const caseId=decodeURIComponent(evalMatch[1]);const result=await calculateCaseRelease(env,caseId,actor.email);return request.headers.get("accept")?.includes("text/html")?redirect(`/cases/${caseId}`):json(result)}

      const evMatch=p.match(/^\/api\/cases\/([^/]+)\/evidence$/);
      if(request.method==="POST"&&evMatch){const caseId=decodeURIComponent(evMatch[1]);const form=await request.formData();const file=form.get("file");if(!(file instanceof File)) return json({error:"file required"},400);await storeEvidence(env,{file,caseId,evidenceType:String(form.get("evidenceType")||"OTHER"),source:String(form.get("source")||"UPLOAD"),actorEmail:actor.email});return redirect(`/cases/${caseId}`)}

      if (request.method === "GET" && p === "/api/health") return json({ ok: true, app: env.APP_NAME, environment: env.ENVIRONMENT, actor: actor.email });
      return new Response("Not found", { status: 404 });
    } catch (error) {
      if (error instanceof Response) return error;
      console.error(error);
      return Response.json({ error: "Internal error", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  },
};
