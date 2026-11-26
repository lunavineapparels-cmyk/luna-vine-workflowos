import type { Env, MinimalExecutionContext } from "./types";
import { requireActor, requirePermission, gateReviewPermission } from "./services/auth";
import { createProductReleaseCase, setGateResult, calculateCaseRelease } from "./services/workflows";
import { storeEvidence } from "./services/evidence";
import { createPsychographicSegment, createMarketingHypothesis, setMarketingReview, createMarketingExperiment, startMarketingExperiment, completeMarketingExperiment, approveMarketingLearning } from "./services/marketingPsychology";
import { createOrUpdateUser, assignRole, revokeRole, setUserStatus } from "./services/accessAdmin";
import { dashboard, casesPage, newCasePage, caseDetail, genericTable, marketingPsychologyPage, newPsychographicSegmentPage, newMarketingHypothesisPage, marketingHypothesisDetail, marketingExperimentDetail, financeCenterPage } from "./ui/pages";
import { accessAdminPage } from "./ui/adminPages";
import { helpCenterPage, helpArticlePage } from "./ui/helpPages";
export { ProductReleaseWorkflow } from "./workflows/productRelease";

function redirect(location: string): Response { return new Response(null, { status: 303, headers: { Location: location } }); }
function json(value: unknown, status=200): Response { return Response.json(value,{status}); }
function html(value:string):Response { return new Response(value,{headers:{"content-type":"text/html; charset=utf-8"}}); }
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

      if (request.method === "GET" && p === "/") { requirePermission(actor,"dashboard.read"); return html(await dashboard(env, actor.email)); }
      if (request.method === "GET" && p === "/cases") { requirePermission(actor,"workflow.read"); return html(await casesPage(env, actor.email)); }
      if (request.method === "GET" && p === "/cases/new") { requirePermission(actor,"workflow.create"); return html(newCasePage(actor.email)); }
      if (request.method === "GET" && p.startsWith("/cases/")) { requirePermission(actor,"workflow.read"); const caseId=decodeURIComponent(p.split("/")[2]||""); return html(await caseDetail(env,actor.email,caseId)); }
      if (request.method === "GET" && p === "/designs") { requirePermission(actor,"design.read"); return html(await genericTable(env,actor.email,"Designs","SELECT id,name,collection,status,artwork_version_id,updated_at FROM designs ORDER BY updated_at DESC",["id","name","collection","status","artwork_version_id","updated_at"])); }
      if (request.method === "GET" && p === "/products") { requirePermission(actor,"product.read"); return html(await genericTable(env,actor.email,"Products","SELECT id,name,parent_sku,supplier,status,updated_at FROM products ORDER BY updated_at DESC",["id","name","parent_sku","supplier","status","updated_at"])); }
      if (request.method === "GET" && p === "/finance") { requirePermission(actor,"dashboard.read"); return html(financeCenterPage(actor.email)); }
      if (request.method === "GET" && p === "/evidence") { requirePermission(actor,"evidence.read"); return html(await genericTable(env,actor.email,"Evidence Vault","SELECT id,evidence_type,file_name,owner_email,status,created_at FROM evidence ORDER BY created_at DESC",["id","evidence_type","file_name","owner_email","status","created_at"])); }
      if (request.method === "GET" && p === "/audit") { requirePermission(actor,"audit.read"); return html(await genericTable(env,actor.email,"Audit Ledger","SELECT created_at,actor_email,action,object_type,object_id FROM audit_events ORDER BY created_at DESC LIMIT 200",["created_at","actor_email","action","object_type","object_id"])); }

      if (request.method === "GET" && p === "/help") { requirePermission(actor,"help.read"); return html(await helpCenterPage(env,actor)); }
      const helpMatch=p.match(/^\/help\/([^/]+)$/);
      if(request.method==="GET"&&helpMatch){requirePermission(actor,"help.read");return html(await helpArticlePage(env,actor,decodeURIComponent(helpMatch[1])));}

      if (request.method === "GET" && p === "/admin/access") { requirePermission(actor,"admin.users.read"); requirePermission(actor,"admin.roles.read"); return html(await accessAdminPage(env,actor)); }

      if (request.method === "GET" && p === "/marketing-psychology") { requirePermission(actor,"marketing.read"); return html(await marketingPsychologyPage(env,actor.email)); }
      if (request.method === "GET" && p === "/marketing-psychology/segments/new") { requirePermission(actor,"marketing.manage"); return html(newPsychographicSegmentPage(actor.email)); }
      if (request.method === "GET" && p === "/marketing-psychology/hypotheses/new") { requirePermission(actor,"marketing.manage"); return html(await newMarketingHypothesisPage(env,actor.email)); }
      const expDetail=p.match(/^\/marketing-psychology\/experiments\/([^/]+)$/);
      if(request.method==="GET"&&expDetail){requirePermission(actor,"marketing.read");return html(await marketingExperimentDetail(env,actor.email,decodeURIComponent(expDetail[1])));}
      if (request.method === "GET" && p.startsWith("/marketing-psychology/")) { requirePermission(actor,"marketing.read"); const id=decodeURIComponent(p.split("/")[2]||""); return html(await marketingHypothesisDetail(env,actor.email,id)); }

      if (request.method === "POST" && p === "/api/admin/users") {
        requirePermission(actor,"admin.users.manage"); const body=await formOrJson(request); if(!body.email) return json({error:"email required"},400);
        await createOrUpdateUser(env,{email:body.email,displayName:body.displayName,status:body.status,actorEmail:actor.email}); return redirect("/admin/access");
      }
      const userStatus=p.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
      if(request.method==="POST"&&userStatus){requirePermission(actor,"admin.users.manage");const body=await formOrJson(request);if(!body.reason) return json({error:"reason required"},400);await setUserStatus(env,{userId:decodeURIComponent(userStatus[1]),status:body.status||"ACTIVE",reason:body.reason,actorEmail:actor.email});return redirect("/admin/access");}
      const userRole=p.match(/^\/api\/admin\/users\/([^/]+)\/roles$/);
      if(request.method==="POST"&&userRole){requirePermission(actor,"admin.roles.manage");const body=await formOrJson(request);if(!body.roleCode||!body.reason) return json({error:"roleCode and reason required"},400);await assignRole(env,{userId:decodeURIComponent(userRole[1]),roleCode:body.roleCode,reason:body.reason,actorEmail:actor.email,validTo:body.validTo||undefined});return redirect("/admin/access");}
      const revoke=p.match(/^\/api\/admin\/users\/([^/]+)\/roles\/([^/]+)\/revoke$/);
      if(request.method==="POST"&&revoke){requirePermission(actor,"admin.roles.manage");const body=await formOrJson(request);if(!body.reason) return json({error:"reason required"},400);await revokeRole(env,{userId:decodeURIComponent(revoke[1]),roleCode:decodeURIComponent(revoke[2]),reason:body.reason,actorEmail:actor.email});return redirect("/admin/access");}

      if (request.method === "POST" && p === "/api/marketing/segments") {
        requirePermission(actor,"marketing.manage"); const body=await formOrJson(request); if(!body.name) return json({error:"name required"},400);
        await createPsychographicSegment(env,{name:body.name,description:body.description,lifecycleStage:body.lifecycleStage,values:body.values,desires:body.desires,frustrations:body.frustrations,triggers:body.triggers,objections:body.objections,preferredTone:body.preferredTone,avoid:body.avoid,actorEmail:actor.email}); return redirect("/marketing-psychology");
      }
      if (request.method === "POST" && p === "/api/marketing/hypotheses") {
        requirePermission(actor,"marketing.manage"); const body=await formOrJson(request);
        if(!body.title||!body.problemStatement||!body.proposedIntervention||!body.primaryMetric) return json({error:"title, problemStatement, proposedIntervention and primaryMetric required"},400);
        const created=await createMarketingHypothesis(env,{title:body.title,problemStatement:body.problemStatement,proposedIntervention:body.proposedIntervention,primaryMetric:body.primaryMetric,segmentId:body.segmentId||undefined,productId:body.productId||undefined,caseId:body.caseId||undefined,models:body.models,guardrails:body.guardrails,riskLevel:body.riskLevel,legalRequired:body.legalRequired==="true",claimsRequired:body.claimsRequired==="true",culturalRequired:body.culturalRequired==="true",actorEmail:actor.email});
        return redirect(`/marketing-psychology/${created.id}`);
      }
      const mktReview=p.match(/^\/api\/marketing\/hypotheses\/([^/]+)\/reviews$/);
      if(request.method==="POST"&&mktReview){requirePermission(actor,"marketing.review");const body=await formOrJson(request);await setMarketingReview(env,{hypothesisId:decodeURIComponent(mktReview[1]),dimension:body.dimension as any,result:body.result as any,reviewerRole:body.reviewerRole||"Council Reviewer",rationale:body.rationale||"",score:body.score?Number(body.score):undefined,riskFlags:body.riskFlags,actorEmail:actor.email});return redirect(`/marketing-psychology/${decodeURIComponent(mktReview[1])}`);}
      const mktExp=p.match(/^\/api\/marketing\/hypotheses\/([^/]+)\/experiments$/);
      if(request.method==="POST"&&mktExp){requirePermission(actor,"marketing.experiment");const body=await formOrJson(request);await createMarketingExperiment(env,{hypothesisId:decodeURIComponent(mktExp[1]),channel:body.channel,audienceDescription:body.audienceDescription,control:body.control,variant:body.variant,primaryMetric:body.primaryMetric,guardrails:body.guardrails,actorEmail:actor.email});return redirect(`/marketing-psychology/${decodeURIComponent(mktExp[1])}`);}
      const mktStart=p.match(/^\/api\/marketing\/experiments\/([^/]+)\/start$/);
      if(request.method==="POST"&&mktStart){requirePermission(actor,"marketing.experiment");await startMarketingExperiment(env,{experimentId:decodeURIComponent(mktStart[1]),actorEmail:actor.email});return redirect(`/marketing-psychology/experiments/${decodeURIComponent(mktStart[1])}`);}
      const mktComplete=p.match(/^\/api\/marketing\/experiments\/([^/]+)\/complete$/);
      if(request.method==="POST"&&mktComplete){requirePermission(actor,"marketing.experiment");const body=await formOrJson(request);await completeMarketingExperiment(env,{experimentId:decodeURIComponent(mktComplete[1]),sampleSize:body.sampleSize?Number(body.sampleSize):undefined,resultsSummary:body.resultsSummary,decision:body.decision as any,learning:body.learning,confidence:body.confidence,evidenceQuality:body.evidenceQuality,applicability:body.applicability,actorEmail:actor.email});return redirect(`/marketing-psychology/experiments/${decodeURIComponent(mktComplete[1])}`);}
      const learningApprove=p.match(/^\/api\/marketing\/learnings\/([^/]+)\/approve$/);
      if(request.method==="POST"&&learningApprove){requirePermission(actor,"marketing.learning.approve");await approveMarketingLearning(env,{learningId:decodeURIComponent(learningApprove[1]),actorEmail:actor.email});return redirect(request.headers.get("referer")||"/marketing-psychology");}

      if (request.method === "POST" && p === "/api/cases") {
        requirePermission(actor,"workflow.create"); const body=await formOrJson(request); if(!body.title) return json({error:"title required"},400);
        const created=await createProductReleaseCase(env,{title:body.title,actorEmail:actor.email,riskLevel:body.riskLevel});
        const instance=await env.PRODUCT_RELEASE_WORKFLOW.create({id:`release-${created.id}`,params:{caseId:created.id,actorEmail:actor.email}});
        return request.headers.get("accept")?.includes("text/html") ? redirect(`/cases/${created.id}`) : json({...created,workflowInstanceId:instance.id},201);
      }

      const gateMatch=p.match(/^\/api\/cases\/([^/]+)\/gates\/([^/]+)$/);
      if(request.method==="POST"&&gateMatch){const gateCode=decodeURIComponent(gateMatch[2]);requirePermission(actor,gateReviewPermission(gateCode));const body=await formOrJson(request);await setGateResult(env,{caseId:decodeURIComponent(gateMatch[1]),gateCode,result:body.result,notes:body.notes,actorEmail:actor.email});return redirect(`/cases/${decodeURIComponent(gateMatch[1])}`);}

      const evalMatch=p.match(/^\/api\/cases\/([^/]+)\/evaluate$/);
      if(request.method==="POST"&&evalMatch){requirePermission(actor,"gate.evaluate");const caseId=decodeURIComponent(evalMatch[1]);const result=await calculateCaseRelease(env,caseId,actor.email);return request.headers.get("accept")?.includes("text/html")?redirect(`/cases/${caseId}`):json(result);}

      const evMatch=p.match(/^\/api\/cases\/([^/]+)\/evidence$/);
      if(request.method==="POST"&&evMatch){requirePermission(actor,"evidence.upload");const caseId=decodeURIComponent(evMatch[1]);const form=await request.formData();const file=form.get("file");if(!(file instanceof File)) return json({error:"file required"},400);await storeEvidence(env,{file,caseId,evidenceType:String(form.get("evidenceType")||"OTHER"),source:String(form.get("source")||"UPLOAD"),actorEmail:actor.email});return redirect(`/cases/${caseId}`);}

      if (request.method === "GET" && p === "/api/health") return json({ ok: true, app: env.APP_NAME, environment: env.ENVIRONMENT, actor: actor.email, roles: actor.roles });
      return new Response("Not found", { status: 404 });
    } catch (error) {
      if (error instanceof Response) return error;
      console.error(error);
      return Response.json({ error: "Internal error", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  },
};
