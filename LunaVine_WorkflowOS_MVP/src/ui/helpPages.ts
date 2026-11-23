import type { Env } from "../types";
import type { AuthenticatedActor } from "../services/auth";
import { layout, escapeHtml } from "./layout";

export async function helpCenterPage(env:Env,actor:AuthenticatedActor):Promise<string>{
  const articles=await env.DB.prepare(`SELECT slug,module,title,summary,audience,version FROM help_articles WHERE status='PUBLISHED' ORDER BY module,title`).all<any>();
  const cards=articles.results.map(a=>`<div class="card"><div class="eyebrow">${escapeHtml(a.module)}</div><h3>${escapeHtml(a.title)}</h3><p class="muted">${escapeHtml(a.summary)}</p><div class="small muted">Audience: ${escapeHtml(a.audience)} · v${escapeHtml(a.version)}</div><div style="margin-top:12px"><a class="btn alt" href="/help/${encodeURIComponent(a.slug)}">Open guide</a></div></div>`).join("");
  return layout("Help & Training",actor.email,`<div class="top"><div><div class="eyebrow">HELP-001</div><div class="h1">Help & Training Center</div><div class="muted">Step-by-step operating guidance, examples, governance rules and troubleshooting.</div></div></div><div class="grid">${cards}</div>`);
}

export async function helpArticlePage(env:Env,actor:AuthenticatedActor,slug:string):Promise<string>{
  const a=await env.DB.prepare(`SELECT * FROM help_articles WHERE slug=? AND status='PUBLISHED'`).bind(slug).first<any>();
  if(!a) return layout("Help article not found",actor.email,`<div class="h1">Help article not found</div>`);
  return layout(a.title,actor.email,`<div class="top"><div><div class="eyebrow">${escapeHtml(a.module)} · v${escapeHtml(a.version)}</div><div class="h1">${escapeHtml(a.title)}</div><div class="muted">${escapeHtml(a.summary)}</div></div><a class="btn alt" href="/help">Back to Help</a></div><div class="card"><pre style="white-space:pre-wrap;font:inherit;line-height:1.65;margin:0">${escapeHtml(a.body_markdown)}</pre></div>`);
}
