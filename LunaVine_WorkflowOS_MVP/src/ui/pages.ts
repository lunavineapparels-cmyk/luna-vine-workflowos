import type { Env } from "../types";
import { escapeHtml, layout } from "./layout";

function badge(value: string) {
  const cls = value.includes("PASS") || value.includes("READY") ? "pass" : value.includes("HOLD") || value.includes("NOT_STARTED") ? "hold" : value.includes("FAIL") || value.includes("REJECT") || value.includes("ESCALATE") ? "fail" : "";
  return `<span class="badge ${cls}">${escapeHtml(value)}</span>`;
}

export async function dashboard(env: Env, email: string): Promise<string> {
  const caseCount = await env.DB.prepare("SELECT COUNT(*) AS n FROM workflow_cases").first<{ n: number }>();
  const holdCount = await env.DB.prepare("SELECT COUNT(*) AS n FROM workflow_cases WHERE release_decision = 'HOLD'").first<{ n: number }>();
  const readyCount = await env.DB.prepare("SELECT COUNT(*) AS n FROM workflow_cases WHERE release_decision = 'RELEASE_READY'").first<{ n: number }>();
  const evidenceCount = await env.DB.prepare("SELECT COUNT(*) AS n FROM evidence").first<{ n: number }>();
  const gateTotal = await env.DB.prepare("SELECT COUNT(*) AS n FROM case_gates").first<{ n: number }>();
  const gatePass = await env.DB.prepare("SELECT COUNT(*) AS n FROM case_gates WHERE result = 'PASS'").first<{ n: number }>();
  const taskOpen = await env.DB.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status NOT IN ('COMPLETED','CANCELLED')").first<{ n: number }>();
  const recent = await env.DB.prepare(`SELECT id,title,status,risk_level,COALESCE(release_decision,'NOT_EVALUATED') AS release_decision,updated_at FROM workflow_cases ORDER BY updated_at DESC LIMIT 8`).all<any>();

  const totalGates = gateTotal?.n ?? 0;
  const passedGates = gatePass?.n ?? 0;
  const gatePct = totalGates ? Math.round((passedGates / totalGates) * 100) : 0;
  const rows = recent.results.map((r:any)=>`<tr><td><a href="/cases/${encodeURIComponent(r.id)}"><strong>${escapeHtml(r.title)}</strong></a><div class="muted tiny mono">${escapeHtml(r.id)}</div></td><td>${badge(r.status)}</td><td>${escapeHtml(r.risk_level)}</td><td>${badge(r.release_decision)}</td><td>${escapeHtml(r.updated_at)}</td></tr>`).join("");

  return layout("Control Tower", email, `
    <section class="hero-panel">
      <div class="eyebrow">Executive Control Tower · BrandOS V5.1</div>
      <div class="h1">Govern the brand.<br>Release with evidence.</div>
      <div class="lede">One operating view for design, evidence, risk, production readiness, approvals and accountable release decisions. Creative approval never bypasses the Release Gate.</div>
      <div class="actions hero-actions"><a class="btn" href="/cases/new">Create Product Release Case</a><a class="btn alt" href="/help">Open Training Center</a></div>
    </section>

    <div class="grid">
      <div class="card metric-card"><span class="metric-accent"></span><div class="metric-label">Workflow cases</div><div class="metric">${caseCount?.n ?? 0}</div><div class="metric-note">Controlled work in the operating system</div></div>
      <div class="card metric-card"><span class="metric-accent ok"></span><div class="metric-label">Release ready</div><div class="metric">${readyCount?.n ?? 0}</div><div class="metric-note">Passed mandatory gates + final review</div></div>
      <div class="card metric-card"><span class="metric-accent hold"></span><div class="metric-label">On hold</div><div class="metric">${holdCount?.n ?? 0}</div><div class="metric-note">Blocked from release until resolved</div></div>
      <div class="card metric-card"><span class="metric-accent"></span><div class="metric-label">Evidence records</div><div class="metric">${evidenceCount?.n ?? 0}</div><div class="metric-note">Traceable evidence linked to decisions</div></div>
    </div>

    <div class="section status-panel">
      <div class="card">
        <div class="section-head"><div><div class="eyebrow">Governance posture</div><h2>Release-control health</h2></div><span class="badge ${gatePct===100 && totalGates>0 ? 'pass' : 'hold'}">${gatePct}% gates passed</span></div>
        <div class="status-list">
          <div class="status-row"><div><strong>Mandatory gate completion</strong><span> ${passedGates} of ${totalGates} recorded PASS</span></div><span>${gatePct}%</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${gatePct}%"></div></div>
          <div class="status-row"><div><strong>Release-ready cases</strong><span> Final accountable decisions</span></div><span>${readyCount?.n ?? 0}</span></div>
          <div class="status-row"><div><strong>Evidence Vault</strong><span> Immutable traceability records</span></div><span>${evidenceCount?.n ?? 0}</span></div>
          <div class="status-row"><div><strong>Open operational tasks</strong><span> Work requiring action</span></div><span>${taskOpen?.n ?? 0}</span></div>
        </div>
      </div>
      <div class="card soft">
        <div class="eyebrow">Owner focus</div><h2 style="font-family:Georgia,serif;font-weight:500;margin:8px 0 12px">V5.1 launch discipline</h2>
        <div class="notice ok">WorkflowOS is the control plane. Shopify and POD systems execute only after the required governance state is reached.</div>
        <div class="status-list">
          <div class="status-row"><strong>Creative endorsement</strong>${badge('APPROVED')}</div>
          <div class="status-row"><strong>Release clearance</strong>${badge((readyCount?.n ?? 0)>0?'PARTIAL_READY':'HOLD')}</div>
          <div class="status-row"><strong>Production publish</strong><span>Human-controlled</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><div><div class="eyebrow">Work queue</div><h2>Recent cases</h2></div><a class="btn alt" href="/cases">View all cases</a></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Case</th><th>Status</th><th>Risk</th><th>Release</th><th>Updated</th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="5">No workflow cases yet. Create the first controlled product release case.</td></tr>'}</tbody></table></div>
    </div>

    <div class="section">
      <div class="section-head"><div><div class="eyebrow">Fast navigation</div><h2>Command shortcuts</h2></div><span class="section-kicker">Operate · Govern · Learn</span></div>
      <div class="quick-grid">
        <a class="quick-link" href="/designs"><strong>Design Registry</strong><span>Review canonical design records and their governed status.</span></a>
        <a class="quick-link" href="/evidence"><strong>Evidence Vault</strong><span>Trace release decisions back to files, checksums and proof.</span></a>
        <a class="quick-link" href="/audit"><strong>Audit Ledger</strong><span>Inspect who changed what, when, and with which outcome.</span></a>
        <a class="quick-link" href="/products"><strong>Product Registry</strong><span>Track canonical products, variants and production identity.</span></a>
        <a class="quick-link" href="/marketing-psychology"><strong>Marketing Psychology</strong><span>Govern hypotheses, ethical checks, experiments and learnings.</span></a>
        <a class="quick-link" href="/admin/access"><strong>Access Administration</strong><span>Manage roles and scoped access without bypassing release authority.</span></a>
      </div>
    </div>`);
}

export async function casesPage(env: Env, email: string): Promise<string> {
  const cases = await env.DB.prepare(`SELECT id,title,status,stage,risk_level,COALESCE(release_decision,'NOT_EVALUATED') AS release_decision,updated_at FROM workflow_cases ORDER BY updated_at DESC`).all<any>();
  const rows = cases.results.map((r:any)=>`<tr><td><a href="/cases/${encodeURIComponent(r.id)}">${escapeHtml(r.title)}</a><div class="muted small">${escapeHtml(r.id)}</div></td><td>${badge(r.status)}</td><td>${escapeHtml(r.stage)}</td><td>${escapeHtml(r.risk_level)}</td><td>${badge(r.release_decision)}</td></tr>`).join("");
  return layout("Workflow Cases", email, `<div class="top"><div><div class="eyebrow">Workflow execution</div><div class="h1">Cases</div></div><a class="btn" href="/cases/new">New Case</a></div><table class="table"><thead><tr><th>Case</th><th>Status</th><th>Stage</th><th>Risk</th><th>Release</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No workflow cases.</td></tr>'}</tbody></table>`);
}

export function newCasePage(email: string): string {
  return layout("New Product Release", email, `<div class="top"><div><div class="eyebrow">Product Release</div><div class="h1">Create workflow case</div></div></div><div class="card"><form method="post" action="/api/cases" class="form"><label>Case title<input name="title" required placeholder="Example: Blessings Ivory Tee — Batch 1"></label><label>Risk level<select name="riskLevel"><option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>CRITICAL</option></select></label><div class="full"><button class="btn" type="submit">Create case</button></div></form></div>`);
}

export async function caseDetail(env: Env, email: string, caseId: string): Promise<string> {
  const c = await env.DB.prepare(`SELECT * FROM workflow_cases WHERE id = ?`).bind(caseId).first<any>();
  if (!c) return layout("Not Found", email, `<div class="h1">Case not found</div>`);
  const gates = await env.DB.prepare(`SELECT gd.code,gd.name,gd.category,gd.risk_severity,cg.result,cg.notes,cg.reviewer_email,cg.reviewed_at FROM case_gates cg JOIN gate_definitions gd ON gd.id=cg.gate_definition_id WHERE cg.case_id=? ORDER BY gd.sort_order,gd.code`).bind(caseId).all<any>();
  const evidence = await env.DB.prepare(`SELECT id,evidence_type,file_name,checksum_sha256,created_at FROM evidence WHERE case_id=? ORDER BY created_at DESC`).bind(caseId).all<any>();
  const gateRows = gates.results.map((g:any)=>`<tr><td><strong>${escapeHtml(g.name)}</strong><div class="muted small">${escapeHtml(g.code)}</div></td><td>${escapeHtml(g.category)}</td><td>${escapeHtml(g.risk_severity)}</td><td>${badge(g.result)}</td><td><form method="post" action="/api/cases/${encodeURIComponent(caseId)}/gates/${encodeURIComponent(g.code)}"><select name="result"><option ${g.result==='NOT_STARTED'?'selected':''}>NOT_STARTED</option><option ${g.result==='PASS'?'selected':''}>PASS</option><option ${g.result==='HOLD'?'selected':''}>HOLD</option><option ${g.result==='FAIL'?'selected':''}>FAIL</option><option ${g.result==='N_A'?'selected':''}>N_A</option></select><input name="notes" value="${escapeHtml(g.notes || '')}" placeholder="Evidence/review note"><button class="btn" type="submit">Save</button></form></td></tr>`).join("");
  const evidenceRows = evidence.results.map((e:any)=>`<tr><td>${escapeHtml(e.evidence_type)}</td><td>${escapeHtml(e.file_name)}</td><td class="small">${escapeHtml(String(e.checksum_sha256).slice(0,16))}…</td><td>${escapeHtml(e.created_at)}</td></tr>`).join("");
  return layout(c.title,email,`<div class="top"><div><div class="eyebrow">${escapeHtml(c.workflow_type)} · ${escapeHtml(c.id)}</div><div class="h1">${escapeHtml(c.title)}</div><div class="muted">Status ${badge(c.status)} · Release ${badge(c.release_decision || 'NOT_EVALUATED')}</div></div><form method="post" action="/api/cases/${encodeURIComponent(caseId)}/evaluate"><button class="btn" type="submit">Evaluate Release Gate</button></form></div><div class="notice">Release readiness is calculated from required gates. A high creative score never overrides failed legal, safety, production, or evidence controls.</div><div class="section"><h2>Required gates</h2><table class="table"><thead><tr><th>Gate</th><th>Category</th><th>Risk</th><th>Result</th><th>Review</th></tr></thead><tbody>${gateRows}</tbody></table></div><div class="section"><h2>Evidence Vault</h2><div class="card"><form method="post" action="/api/cases/${encodeURIComponent(caseId)}/evidence" enctype="multipart/form-data" class="form"><label>Evidence type<select name="evidenceType"><option>LEGAL_IP</option><option>ARTWORK</option><option>SAMPLE_QA</option><option>PRICING</option><option>SHIPPING_RETURNS</option><option>MOCKUP_RIGHTS</option><option>PRODUCTION</option><option>OTHER</option></select></label><label>File<input name="file" type="file" required></label><label class="full">Source<input name="source" placeholder="Upload / supplier / review source"></label><div class="full"><button class="btn" type="submit">Store evidence</button></div></form></div><table class="table" style="margin-top:12px"><thead><tr><th>Type</th><th>File</th><th>SHA-256</th><th>Date</th></tr></thead><tbody>${evidenceRows || '<tr><td colspan="4">No evidence yet.</td></tr>'}</tbody></table></div>`);
}

export async function genericTable(env: Env,email:string,title:string,sql:string,cols:string[]):Promise<string>{const data=await env.DB.prepare(sql).all<any>();const rows=data.results.map((r:any)=>`<tr>${cols.map(c=>`<td>${escapeHtml(r[c] ?? '')}</td>`).join('')}</tr>`).join('');return layout(title,email,`<div class="top"><div><div class="eyebrow">Registry</div><div class="h1">${escapeHtml(title)}</div></div></div><table class="table"><thead><tr>${cols.map(c=>`<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${cols.length}">No records yet.</td></tr>`}</tbody></table>`)}

function jsonList(value: unknown): string {
  try { const v=JSON.parse(String(value||"[]")); return Array.isArray(v)?v.join(", "):String(value||""); } catch { return String(value||""); }
}

export async function marketingPsychologyPage(env: Env, email: string): Promise<string> {
  const segments=await env.DB.prepare(`SELECT * FROM psychographic_segments ORDER BY updated_at DESC LIMIT 20`).all<any>();
  const hypotheses=await env.DB.prepare(`SELECT h.*,s.name AS segment_name FROM marketing_hypotheses h LEFT JOIN psychographic_segments s ON s.id=h.segment_id ORDER BY h.updated_at DESC LIMIT 30`).all<any>();
  const modelCount=await env.DB.prepare(`SELECT COUNT(*) AS n FROM marketing_psych_models WHERE active=1`).first<{n:number}>();
  const learningCount=await env.DB.prepare(`SELECT COUNT(*) AS n FROM marketing_learning_registry WHERE reusable=1`).first<{n:number}>();
  const readyCount=await env.DB.prepare(`SELECT COUNT(*) AS n FROM marketing_hypotheses WHERE status='READY_TO_TEST'`).first<{n:number}>();
  const segRows=segments.results.map((s:any)=>`<tr><td><strong>${escapeHtml(s.name)}</strong><div class="muted small">${escapeHtml(s.description||"")}</div></td><td>${escapeHtml(s.lifecycle_stage||"")}</td><td>${badge(s.status)}</td><td>${escapeHtml(s.evidence_quality)}</td><td class="small">${escapeHtml(jsonList(s.values_json))}</td></tr>`).join("");
  const hypRows=hypotheses.results.map((h:any)=>`<tr><td><a href="/marketing-psychology/${encodeURIComponent(h.id)}"><strong>${escapeHtml(h.title)}</strong></a><div class="muted small">${escapeHtml(h.id)}</div></td><td>${escapeHtml(h.segment_name||"Unassigned")}</td><td>${badge(h.status)}</td><td>${escapeHtml(h.primary_metric)}</td><td>${badge(h.ethics_status)}</td><td>${badge(h.brand_status)}</td></tr>`).join("");
  return layout("Marketing Psychology",email,`<div class="top"><div><div class="eyebrow">SKILL-MKT-001</div><div class="h1">Marketing Psychology & Consumer Insight</div><div class="muted">Psychographics + behavioral science → governed hypotheses → experiments → measured Luna Vine learning.</div></div><div class="actions"><a class="btn alt" href="/marketing-psychology/segments/new">New Segment</a><a class="btn" href="/marketing-psychology/hypotheses/new">New Hypothesis</a></div></div><div class="notice"><strong>Governance rule:</strong> psychology is never treated as marketing truth. No hypothesis may become READY_TO_TEST until Brand and Ethics pass, plus Legal, Claims, and Cultural review whenever applicable. Fake scarcity, fake social proof, deceptive pricing, hidden consent, and dark patterns are prohibited.</div><div class="grid"><div class="card"><div class="muted small">Behavioral Models</div><div class="metric">${modelCount?.n??0}</div></div><div class="card"><div class="muted small">Segments</div><div class="metric">${segments.results.length}</div></div><div class="card"><div class="muted small">Ready to Test</div><div class="metric">${readyCount?.n??0}</div></div><div class="card"><div class="muted small">Reusable Learnings</div><div class="metric">${learningCount?.n??0}</div></div></div><div class="section"><h2>Psychographic segments</h2><table class="table"><thead><tr><th>Segment</th><th>Lifecycle</th><th>Status</th><th>Evidence</th><th>Values</th></tr></thead><tbody>${segRows||'<tr><td colspan="5">No segments yet.</td></tr>'}</tbody></table></div><div class="section"><h2>Marketing hypotheses</h2><table class="table"><thead><tr><th>Hypothesis</th><th>Segment</th><th>Status</th><th>Primary metric</th><th>Ethics</th><th>Brand</th></tr></thead><tbody>${hypRows||'<tr><td colspan="6">No hypotheses yet.</td></tr>'}</tbody></table></div>`);
}

export function newPsychographicSegmentPage(email:string):string {
  return layout("New Psychographic Segment",email,`<div class="top"><div><div class="eyebrow">Consumer intelligence</div><div class="h1">New psychographic segment</div><div class="muted">Comma-separate multiple values. Start as a hypothesis; promote only when customer evidence supports it.</div></div></div><div class="card"><form class="form" method="post" action="/api/marketing/segments"><label>Segment name<input name="name" required placeholder="Quietly Confident Woman"></label><label>Lifecycle stage<input name="lifecycleStage" placeholder="Subscriber / First Buyer / Repeat Buyer"></label><label class="full">Description<textarea name="description" rows="2"></textarea></label><label>Values<input name="values" placeholder="Quality, self-respect, growth"></label><label>Desires<input name="desires" placeholder="Elegant, meaningful, understated"></label><label>Frustrations<input name="frustrations" placeholder="Cheap graphics, loud branding"></label><label>Purchase triggers<input name="triggers" placeholder="Story, premium material, proof"></label><label>Objections<input name="objections" placeholder="Worth the price?, fit?, print quality?"></label><label>Preferred tone<input name="preferredTone" placeholder="Elegant, warm, confident"></label><label class="full">Avoid<input name="avoid" placeholder="Aggressive urgency, fake scarcity, fear marketing"></label><div class="full"><button class="btn" type="submit">Create segment</button></div></form></div>`);
}

export async function newMarketingHypothesisPage(env:Env,email:string):Promise<string> {
  const segs=await env.DB.prepare(`SELECT id,name FROM psychographic_segments ORDER BY name`).all<any>();
  const products=await env.DB.prepare(`SELECT id,name FROM products ORDER BY name`).all<any>();
  const models=await env.DB.prepare(`SELECT code,name,category,default_risk FROM marketing_psych_models WHERE active=1 ORDER BY category,name`).all<any>();
  const segOpts=segs.results.map((s:any)=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join("");
  const prodOpts=products.results.map((s:any)=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join("");
  const modelText=models.results.map((m:any)=>`${m.code} — ${m.name} [${m.category}/${m.default_risk}]`).join("\n");
  return layout("New Marketing Hypothesis",email,`<div class="top"><div><div class="eyebrow">Hypothesis → Experiment → Evidence</div><div class="h1">Create marketing hypothesis</div></div></div><div class="card"><form class="form" method="post" action="/api/marketing/hypotheses"><label>Title<input name="title" required placeholder="Identity-led copy improves product-page conversion"></label><label>Segment<select name="segmentId"><option value="">Unassigned</option>${segOpts}</select></label><label>Product<select name="productId"><option value="">Unassigned</option>${prodOpts}</select></label><label>Risk<select name="riskLevel"><option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>CRITICAL</option></select></label><label class="full">Problem statement<textarea name="problemStatement" required rows="3" placeholder="What behavior or friction are we trying to understand?"></textarea></label><label class="full">Proposed intervention<textarea name="proposedIntervention" required rows="3" placeholder="What change are we proposing, and why might it work?"></textarea></label><label>Behavioral model codes<input name="models" placeholder="IDENTITY_MOTIVATION, PROCESSING_FLUENCY"></label><label>Primary metric<input name="primaryMetric" required placeholder="Product-page conversion rate"></label><label class="full">Guardrails<input name="guardrails" placeholder="Contribution margin, return rate, unsubscribe rate, brand sentiment"></label><label><input type="checkbox" name="legalRequired" value="true" style="width:auto"> Legal review required</label><label><input type="checkbox" name="claimsRequired" value="true" style="width:auto"> Claims review required</label><label><input type="checkbox" name="culturalRequired" value="true" style="width:auto"> Cultural review required</label><div class="full"><button class="btn" type="submit">Create hypothesis</button></div></form></div><div class="section"><h2>Available behavioral models</h2><pre class="card small" style="white-space:pre-wrap">${escapeHtml(modelText)}</pre></div>`);
}

export async function marketingHypothesisDetail(env:Env,email:string,id:string):Promise<string> {
  const h=await env.DB.prepare(`SELECT h.*,s.name AS segment_name,p.name AS product_name FROM marketing_hypotheses h LEFT JOIN psychographic_segments s ON s.id=h.segment_id LEFT JOIN products p ON p.id=h.product_id WHERE h.id=?`).bind(id).first<any>();
  if(!h) return layout("Not Found",email,`<div class="h1">Marketing hypothesis not found</div>`);
  const reviews=await env.DB.prepare(`SELECT * FROM marketing_council_reviews WHERE hypothesis_id=? ORDER BY created_at DESC`).bind(id).all<any>();
  const exps=await env.DB.prepare(`SELECT * FROM marketing_experiments WHERE hypothesis_id=? ORDER BY created_at DESC`).bind(id).all<any>();
  const reviewRows=reviews.results.map((r:any)=>`<tr><td>${escapeHtml(r.reviewer_role)}</td><td>${badge(r.verdict)}</td><td>${escapeHtml(r.score??"")}</td><td>${escapeHtml(r.rationale)}</td><td>${escapeHtml(r.created_at)}</td></tr>`).join("");
  const expRows=exps.results.map((e:any)=>`<tr><td><a href="/marketing-psychology/experiments/${encodeURIComponent(e.id)}">${escapeHtml(e.channel)}</a></td><td>${badge(e.status)}</td><td>${escapeHtml(e.primary_metric)}</td><td>${escapeHtml(e.decision||"")}</td></tr>`).join("");
  const statusRows=[['ethics','Ethics / Dark-pattern Review',h.ethics_status,'Ethics & Compliance Reviewer'],['brand','Premium Brand Review',h.brand_status,'Premium Brand Strategist'],['legal','Legal Review',h.legal_status,'Legal & Risk Reviewer'],['claims','Claims Review',h.claims_status,'Claims Evidence Reviewer'],['cultural','Cultural Review',h.cultural_status,'Cultural Review Lead']].map(([dim,name,status,role])=>`<tr><td><strong>${name}</strong></td><td>${badge(String(status))}</td><td>${status==='N_A'?'<span class="muted small">Not applicable</span>':`<form method="post" action="/api/marketing/hypotheses/${encodeURIComponent(id)}/reviews"><input type="hidden" name="dimension" value="${dim}"><input type="hidden" name="reviewerRole" value="${escapeHtml(role)}"><select name="result"><option>NOT_STARTED</option><option>PASS</option><option>HOLD</option><option>FAIL</option></select><input name="score" type="number" min="0" max="10" step="0.1" placeholder="Score 0–10"><input name="riskFlags" placeholder="Risk flags, comma-separated"><textarea name="rationale" required placeholder="Evidence-backed rationale"></textarea><button class="btn" type="submit">Record review</button></form>`}</td></tr>`).join("");
  return layout(h.title,email,`<div class="top"><div><div class="eyebrow">${escapeHtml(h.id)}</div><div class="h1">${escapeHtml(h.title)}</div><div class="muted">Segment: ${escapeHtml(h.segment_name||"Unassigned")} · Product: ${escapeHtml(h.product_name||"Unassigned")} · ${badge(h.status)}</div></div></div><div class="grid"><div class="card"><div class="muted small">Primary Metric</div><div style="margin-top:8px"><strong>${escapeHtml(h.primary_metric)}</strong></div></div><div class="card"><div class="muted small">Risk</div><div style="margin-top:8px">${badge(h.risk_level)}</div></div><div class="card"><div class="muted small">Models</div><div class="small" style="margin-top:8px">${escapeHtml(jsonList(h.behavioral_models_json))}</div></div><div class="card"><div class="muted small">Guardrails</div><div class="small" style="margin-top:8px">${escapeHtml(jsonList(h.guardrails_json))}</div></div></div><div class="section"><h2>Problem</h2><div class="card">${escapeHtml(h.problem_statement)}</div></div><div class="section"><h2>Proposed intervention</h2><div class="card">${escapeHtml(h.proposed_intervention)}</div></div><div class="section"><h2>Mandatory council checks</h2><table class="table"><thead><tr><th>Review</th><th>Status</th><th>Decision</th></tr></thead><tbody>${statusRows}</tbody></table></div><div class="section"><h2>Council record</h2><table class="table"><thead><tr><th>Reviewer</th><th>Verdict</th><th>Score</th><th>Rationale</th><th>Date</th></tr></thead><tbody>${reviewRows||'<tr><td colspan="5">No reviews yet.</td></tr>'}</tbody></table></div><div class="section"><h2>Experiments</h2>${h.status==='READY_TO_TEST'?`<div class="card"><form method="post" action="/api/marketing/hypotheses/${encodeURIComponent(id)}/experiments" class="form"><label>Channel<input name="channel" required placeholder="Shopify PDP / Email / Instagram"></label><label>Audience<input name="audienceDescription" placeholder="Segment and eligibility"></label><label class="full">Control<textarea name="control" required></textarea></label><label class="full">Variant<textarea name="variant" required></textarea></label><label>Primary metric<input name="primaryMetric" required value="${escapeHtml(h.primary_metric)}"></label><label>Guardrails<input name="guardrails" placeholder="Margin, returns, unsubscribe"></label><div class="full"><button class="btn" type="submit">Create experiment draft</button></div></form></div>`:'<div class="notice">Experiments are locked until every applicable review passes.</div>'}<table class="table" style="margin-top:12px"><thead><tr><th>Channel</th><th>Status</th><th>Metric</th><th>Decision</th></tr></thead><tbody>${expRows||'<tr><td colspan="4">No experiments yet.</td></tr>'}</tbody></table></div>`);
}

export async function marketingExperimentDetail(env:Env,email:string,id:string):Promise<string> {
  const e=await env.DB.prepare(`SELECT e.*,h.title AS hypothesis_title FROM marketing_experiments e JOIN marketing_hypotheses h ON h.id=e.hypothesis_id WHERE e.id=?`).bind(id).first<any>();
  if(!e) return layout("Not Found",email,`<div class="h1">Marketing experiment not found</div>`);
  const learnings=await env.DB.prepare(`SELECT * FROM marketing_learning_registry WHERE experiment_id=? ORDER BY created_at DESC`).bind(id).all<any>();
  const lr=learnings.results.map((l:any)=>`<tr><td>${escapeHtml(l.learning)}</td><td>${escapeHtml(l.confidence)}</td><td>${escapeHtml(l.evidence_quality)}</td><td>${badge(l.reusable?'APPROVED':'PENDING')}</td><td>${l.reusable?'':`<form method="post" action="/api/marketing/learnings/${encodeURIComponent(l.id)}/approve"><button class="btn" type="submit">Approve reusable learning</button></form>`}</td></tr>`).join("");
  return layout("Marketing Experiment",email,`<div class="top"><div><div class="eyebrow">Experiment ${escapeHtml(e.id)}</div><div class="h1">${escapeHtml(e.hypothesis_title)}</div><div class="muted">${escapeHtml(e.channel)} · ${badge(e.status)} · Metric: ${escapeHtml(e.primary_metric)}</div></div><a class="btn alt" href="/marketing-psychology/${encodeURIComponent(e.hypothesis_id)}">Back to hypothesis</a></div><div class="grid"><div class="card"><div class="muted small">Audience</div><div style="margin-top:8px">${escapeHtml(e.audience_description||"")}</div></div><div class="card"><div class="muted small">Decision</div><div style="margin-top:8px">${escapeHtml(e.decision||"Not completed")}</div></div><div class="card"><div class="muted small">Sample size</div><div class="metric">${escapeHtml(e.sample_size??0)}</div></div><div class="card"><div class="muted small">Started</div><div class="small" style="margin-top:8px">${escapeHtml(e.started_at||"Not started")}</div></div></div><div class="section"><h2>Control vs Variant</h2><div class="form"><div class="card"><div class="eyebrow">Control</div><pre class="small" style="white-space:pre-wrap">${escapeHtml(e.control_json)}</pre></div><div class="card"><div class="eyebrow">Variant</div><pre class="small" style="white-space:pre-wrap">${escapeHtml(e.variant_json)}</pre></div></div></div>${e.status==='DRAFT'?`<div class="section"><form method="post" action="/api/marketing/experiments/${encodeURIComponent(id)}/start"><button class="btn" type="submit">Start experiment</button></form></div>`:''}${['DRAFT','RUNNING'].includes(e.status)?`<div class="section"><h2>Complete experiment</h2><div class="card"><form method="post" action="/api/marketing/experiments/${encodeURIComponent(id)}/complete" class="form"><label>Sample size<input type="number" min="0" name="sampleSize"></label><label>Decision<select name="decision"><option>WIN</option><option>LOSS</option><option>INCONCLUSIVE</option><option>STOPPED</option></select></label><label class="full">Results summary<textarea name="resultsSummary" required rows="4" placeholder="Measured result; distinguish observation from interpretation."></textarea></label><label class="full">Candidate learning<textarea name="learning" rows="3" placeholder="Optional. This remains non-reusable until explicitly approved."></textarea></label><label>Confidence<select name="confidence"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label><label>Evidence quality<select name="evidenceQuality"><option>EXPERIMENT</option><option>OBSERVATIONAL</option><option>CUSTOMER_RESEARCH</option><option>MIXED</option></select></label><label class="full">Applicability<input name="applicability" placeholder="Which products, segments, channels or contexts does this learning apply to?"></label><div class="full"><button class="btn" type="submit">Complete and record evidence</button></div></form></div></div>`:''}<div class="section"><h2>Learning Registry</h2><table class="table"><thead><tr><th>Learning</th><th>Confidence</th><th>Evidence</th><th>Reusable</th><th>Approval</th></tr></thead><tbody>${lr||'<tr><td colspan="5">No learning recorded.</td></tr>'}</tbody></table></div>`);
}


export function financeCenterPage(email:string):string {
  return layout("Finance Control Center", email, `
    <div class="top"><div><div class="eyebrow">FIN-001 · V5.1 Finance</div><div class="h1">Finance Control Center</div><div class="lede">Near-zero-maintenance financial operations: automate transaction flow and reconciliation, surface only exceptions, and keep money movement under explicit human control.</div></div><span class="badge hold">SETUP PHASE</span></div>
    <div class="grid">
      <div class="card metric-card"><span class="metric-accent"></span><div class="metric-label">Payment processing</div><div style="margin-top:14px"><strong>Shopify Payments</strong></div><div class="metric-note">Decision baseline · owner activation verification required</div></div>
      <div class="card metric-card"><span class="metric-accent"></span><div class="metric-label">Business banking</div><div style="margin-top:14px"><strong>Mercury</strong></div><div class="metric-note">Decision baseline · account not connected</div></div>
      <div class="card metric-card"><span class="metric-accent"></span><div class="metric-label">Accounting ledger</div><div style="margin-top:14px"><strong>QuickBooks Online</strong></div><div class="metric-note">System of record · integration not connected</div></div>
      <div class="card metric-card"><span class="metric-accent"></span><div class="metric-label">Sales tax</div><div style="margin-top:14px"><strong>Shopify Tax</strong></div><div class="metric-note">Planned tax automation · owner/professional verification required</div></div>
    </div>
    <div class="section status-panel">
      <div class="card">
        <div class="section-head"><div><div class="eyebrow">Operating model</div><h2>Zero-maintenance by exception</h2></div><span class="badge pass">CONTROL DESIGN</span></div>
        <div class="status-list">
          <div class="status-row"><div><strong>Customer payment</strong><span> Shopify checkout and primary processor</span></div><span>Shopify Payments</span></div>
          <div class="status-row"><div><strong>Cash custody</strong><span> Operating and reserve accounts</span></div><span>Business bank</span></div>
          <div class="status-row"><div><strong>Official books</strong><span> General ledger and close</span></div><span>QuickBooks</span></div>
          <div class="status-row"><div><strong>Management control</strong><span> Cash, margin, budget, approvals, exceptions</span></div><span>WorkflowOS</span></div>
        </div>
      </div>
      <div class="card soft">
        <div class="eyebrow">Financial safety</div><h2 style="font-family:Georgia,serif;font-weight:500;margin:8px 0 12px">Human-controlled money movement</h2>
        <div class="notice risk">AI may read, analyze, forecast and prepare recommendations. It must not autonomously change payout destinations, transfer money, add bank accounts, or issue material refunds.</div>
        <div class="status-list">
          <div class="status-row"><strong>Bank / payout changes</strong>${badge('HOLD')}</div>
          <div class="status-row"><strong>Autonomous transfers</strong>${badge('REJECTED')}</div>
          <div class="status-row"><strong>Read / analyze / recommend</strong>${badge('APPROVED')}</div>
        </div>
      </div>
    </div>
    <div class="section"><div class="section-head"><div><div class="eyebrow">Planned automation</div><h2>Reconciliation flow</h2></div><span class="section-kicker">No fabricated balances</span></div><div class="quick-grid">
      <div class="quick-link"><strong>1 · Order</strong><span>Shopify records the customer order, payment, discount, tax and refund lifecycle.</span></div>
      <div class="quick-link"><strong>2 · Fulfillment cost</strong><span>Approved POD costs are matched to product/SKU and order economics.</span></div>
      <div class="quick-link"><strong>3 · Payout</strong><span>Processor payout is matched against Shopify transactions and fees.</span></div>
      <div class="quick-link"><strong>4 · Bank</strong><span>Deposit lands in the business operating account with traceable reference.</span></div>
      <div class="quick-link"><strong>5 · Ledger</strong><span>QuickBooks receives the accounting entries and reconciliation evidence.</span></div>
      <div class="quick-link"><strong>6 · Exception</strong><span>WorkflowOS alerts the owner only when amount, timing or mapping does not reconcile.</span></div>
    </div></div>`);
}
