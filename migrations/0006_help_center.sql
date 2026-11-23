PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS help_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'ALL',
  body_markdown TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  updated_by TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED','IN_PROGRESS','COMPLETE')),
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, article_id)
);

INSERT OR IGNORE INTO help_articles(id,slug,module,title,summary,audience,body_markdown) VALUES
('help-getting-started','getting-started','CORE','Getting Started','First login, navigation, safety rules and the owner workflow.','ALL','# Getting Started\n\nPurpose: learn the safe operating sequence for WorkflowOS.\n\nSteps:\n1. Sign in through Cloudflare Access.\n2. Open Control Tower and review blocked/overdue work.\n3. Open Workflow Cases to create or resume governed work.\n4. Use Evidence Vault for proof, not chat history, as release evidence.\n5. Never interpret a creative approval as Release Ready.\n6. Use Help whenever a field or gate is unclear.\n\nExample: A new Bloom Anyway tee begins as a workflow case, receives evidence and reviews, passes production/sample/pricing/listing gates, and only then becomes Release Ready.'),
('help-control-tower','control-tower','CORE','Executive Control Tower','How to read status, blockers, next actions and owner decisions.','OWNER_EXECUTIVE','# Executive Control Tower\n\nPurpose: see operational truth without opening every record.\n\nSteps:\n1. Review active cases.\n2. Prioritize HOLD, ESCALATED and overdue items.\n3. Check evidence completeness and blocking gates.\n4. Open items requiring owner decision.\n5. Never override a blocker merely to improve dashboard status.\n\nExample: If Sample QA is HOLD, the product stays HOLD even when creative approval is complete.'),
('help-evidence','evidence-vault','EVIDENCE','Evidence Vault','Upload, classify and link auditable evidence to the correct business object/version.','ALL','# Evidence Vault\n\nPurpose: preserve proof behind decisions.\n\nSteps:\n1. Open the workflow case.\n2. Choose Add Evidence.\n3. Select evidence type and source.\n4. Upload the file.\n5. Link it to the correct case/product/artwork version.\n6. Verify the record appears in Evidence Vault.\n\nExample: Upload the approved DTF master for LV-ART-000142 and link it to artwork version 7.\n\nCommon mistake: uploading a replacement file without creating a new artwork version.'),
('help-release-gate','release-gate','GOVERNANCE','Release Gate','How blocking gates, conditional gates, HOLD/ESCALATE and final release approval work.','ALL','# Release Gate\n\nPurpose: prevent incomplete or risky products from reaching customers.\n\nSteps:\n1. Open the case.\n2. Review every applicable gate.\n3. Record evidence-backed decisions only.\n4. FAIL/HOLD on critical controls blocks release.\n5. Run calculated evaluation.\n6. Final human release review happens only after mandatory controls pass.\n\nExample: Legal/IP FAIL causes ESCALATE even if every commercial gate passes.'),
('help-marketing-psych','marketing-psychology','MARKETING','Marketing Psychology & Consumer Insight','Create psychographic hypotheses, council reviews, experiments and reusable learning.','GROWTH_CRM','# Marketing Psychology & Consumer Insight\n\nPurpose: turn behavioral ideas into governed experiments rather than assumptions.\n\nSteps:\n1. Create or choose a psychographic segment.\n2. Create a hypothesis and primary metric.\n3. Select relevant behavioral models.\n4. Complete Brand and Ethics reviews plus Legal/Claims/Cultural when applicable.\n5. Create control and variant only after READY_TO_TEST.\n6. Run and measure the experiment.\n7. Approve a learning as reusable only when evidence supports it.\n\nExample: test identity-based Bloom Anyway copy against generic product copy while guarding margin, returns and unsubscribe rate.'),
('help-access-admin','access-admin','ADMIN','Users, Roles & Entitlements','Super User guide for application users, roles, least privilege and access review.','SUPER_USER','# Users, Roles & Entitlements\n\nPurpose: give each person only the permissions needed for their job.\n\nSteps:\n1. Confirm the person is authorized to enter through Cloudflare Access.\n2. Create/activate the WorkflowOS user.\n3. Assign the narrowest suitable role.\n4. Add a reason for every role assignment.\n5. Use time limits/scopes when appropriate.\n6. Review access periodically and revoke access promptly when no longer required.\n\nSuper User rule: Super User cannot delete audit history or silently bypass governance gates.'),
('help-security','security-access','SECURITY','Security & Access','Authentication, authorization, secrets, evidence handling and incident-response basics.','ALL','# Security & Access\n\nPurpose: protect Luna Vine data, systems and customer trust.\n\nRules:\n1. Never share passwords, MFA codes, recovery codes or API secrets in chat.\n2. Cloudflare Access authenticates identity; WorkflowOS RBAC authorizes actions.\n3. Use least privilege and separate DEV/STAGING/PROD.\n4. Treat uploads and external content as untrusted input.\n5. Keep R2 evidence private.\n6. Report suspicious access and unexpected behavior immediately.\n7. Security failures cause HOLD/ESCALATE, never silent release.');
