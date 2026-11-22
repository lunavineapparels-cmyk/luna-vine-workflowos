import { styles } from "./styles";

export function layout(title: string, email: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · Luna Vine WorkflowOS</title><style>${styles}</style></head><body><div class="shell"><aside class="nav"><div class="brand">Luna Vine<br>WorkflowOS</div><div class="sub">BrandOS execution platform</div><a href="/">Control Tower</a><a href="/cases">Workflow Cases</a><a href="/designs">Designs</a><a href="/products">Products</a><a href="/marketing-psychology">Marketing Psychology</a><a href="/evidence">Evidence Vault</a><a href="/audit">Audit Ledger</a></aside><main class="main">${body}<div class="footer">Private Luna Vine internal system · Signed in as ${escapeHtml(email)}</div></main></div></body></html>`;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
