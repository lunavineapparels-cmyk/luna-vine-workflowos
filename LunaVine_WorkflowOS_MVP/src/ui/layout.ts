import { styles } from "./styles";

export function layout(title: string, email: string, body: string) {
  const session = maskIdentity(email);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#151b17"><title>${escapeHtml(title)} · Luna Vine WorkflowOS</title><style>${styles}</style></head><body><div class="shell"><aside class="nav"><div class="brand-wrap"><div class="brand">Luna <em>Vine</em><br>WorkflowOS</div><div class="sub">BrandOS execution platform</div><div class="version-pill">V5.1 PROGRAM · v0.5 UI</div></div><div class="nav-group"><div class="nav-label">Operate</div><a href="/"><span class="nav-dot"></span>Control Tower</a><a href="/cases"><span class="nav-dot"></span>Workflow Cases</a><a href="/designs"><span class="nav-dot"></span>Design Registry</a><a href="/products"><span class="nav-dot"></span>Product Registry</a><a href="/finance"><span class="nav-dot"></span>Finance Control Center</a></div><div class="nav-group"><div class="nav-label">Govern</div><a href="/evidence"><span class="nav-dot"></span>Evidence Vault</a><a href="/audit"><span class="nav-dot"></span>Audit Ledger</a><a href="/marketing-psychology"><span class="nav-dot"></span>Marketing Psychology</a></div><div class="nav-group"><div class="nav-label">Learn & Admin</div><a href="/help"><span class="nav-dot"></span>Help & Training</a><a href="/admin/access"><span class="nav-dot"></span>Access Administration</a></div><div class="nav-footer"><strong>Private enterprise workspace</strong>Cloudflare Access · D1 · R2 · governed release controls</div></aside><div class="workspace"><header class="appbar"><div class="appbar-title"><span class="appbar-mark">V</span><div class="appbar-copy"><strong>${escapeHtml(title)}</strong><span>Luna Vine BrandOS V5.1</span></div></div><div class="system-state"><i></i>Protected production workspace</div></header><main class="main">${body}<div class="footer"><span>Private Luna Vine internal system</span><span>Authenticated session · ${escapeHtml(session)}</span></div></main></div></div></body></html>`;
}

function maskIdentity(value: string): string {
  const [name, domain] = String(value ?? "").split("@");
  if (!domain) return "verified user";
  const visible = name.length <= 2 ? name.slice(0,1) : name.slice(0,2);
  return `${visible}•••@${domain}`;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
