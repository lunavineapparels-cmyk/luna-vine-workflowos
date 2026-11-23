PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','DISABLED')),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  privilege_level INTEGER NOT NULL DEFAULT 10,
  system_role INTEGER NOT NULL DEFAULT 1 CHECK (system_role IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  code TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES roles(code),
  scope_type TEXT NOT NULL DEFAULT 'GLOBAL' CHECK (scope_type IN ('GLOBAL','COLLECTION','PRODUCT','WORKFLOW','PLATFORM')),
  scope_id TEXT,
  valid_from TEXT NOT NULL DEFAULT (datetime('now')),
  valid_to TEXT,
  assigned_by TEXT NOT NULL,
  assignment_reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, role_code, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS sod_rules (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  enforcement TEXT NOT NULL CHECK (enforcement IN ('BLOCK','DUAL_APPROVAL','WARN')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS access_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id),
  reviewer_email TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('RETAIN','CHANGE','REVOKE')),
  notes TEXT,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_code);
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_roles_scope ON user_roles(user_id, role_code, scope_type, IFNULL(scope_id,''));
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_code);

INSERT OR IGNORE INTO roles(code,name,description,privilege_level) VALUES
('SUPER_USER','Super User','Platform owner/admin. Can administer users, roles and configuration, but cannot erase audit history or silently bypass governance gates.',100),
('OWNER_EXECUTIVE','Owner / Executive','Executive control-tower access, final business approvals, release approval and enterprise decisions.',90),
('BRAND_CREATIVE','Brand & Creative','Brand canon, designs, artwork review, creative critique and campaign creative operations.',60),
('LEGAL_RISK','Legal & Risk','Legal/IP, claims, cultural-risk routing, compliance review and release-risk decisions.',70),
('PRODUCTION_OPS','Production Operations','Supplier, POD, production profile, print preflight and manufacturing workflow operations.',60),
('QUALITY_ASSURANCE','Quality Assurance','Sample scoring, QA inspection, defect review and production-quality gates.',60),
('FINANCE_PRICING','Finance & Pricing','Pricing, margin, cost assumptions and profitability approval.',60),
('GROWTH_CRM','Growth & CRM','Marketing psychology, CRM, experiments, campaigns and approved learning operations.',55),
('MARKETPLACE_OPS','Marketplace Operations','Listings, platform readiness, Shopify/Etsy operational preparation.',55),
('ENGINEERING_ADMIN','Engineering Administrator','Application configuration, integrations, deployment support and security operations without business release authority.',80),
('AUDITOR_READONLY','Read-only Auditor','Read-only access to evidence, audit, workflow and control status.',30);

INSERT OR IGNORE INTO permissions(code,module,name,description,risk_level) VALUES
('dashboard.read','CORE','Read Control Tower','View enterprise dashboard and status summaries.','LOW'),
('workflow.read','WORKFLOW','Read workflows','View workflow cases and tasks.','LOW'),
('workflow.create','WORKFLOW','Create workflows','Create governed workflow cases.','MEDIUM'),
('workflow.manage','WORKFLOW','Manage workflows','Update workflow/task state within assigned authority.','HIGH'),
('gate.read','GOVERNANCE','Read gates','View Release Gate and control status.','LOW'),
('gate.review.brand','GOVERNANCE','Brand gate review','Record Brand/Creative gate decisions.','HIGH'),
('gate.review.legal','GOVERNANCE','Legal gate review','Record Legal/IP/claims/compliance gate decisions.','CRITICAL'),
('gate.review.production','GOVERNANCE','Production gate review','Record production/preflight/sample-related gate decisions.','HIGH'),
('gate.review.finance','GOVERNANCE','Finance gate review','Record pricing/margin gate decisions.','HIGH'),
('gate.review.marketplace','GOVERNANCE','Marketplace gate review','Record listing/platform-readiness decisions.','HIGH'),
('gate.evaluate','GOVERNANCE','Evaluate release','Run calculated Release Gate evaluation.','HIGH'),
('release.final_approve','RELEASE','Final human release approval','Perform final human release approval when all blocking controls pass.','CRITICAL'),
('release.override.request','RELEASE','Request governance exception','Request a documented, time-bound governance exception. Does not itself execute an override.','CRITICAL'),
('evidence.read','EVIDENCE','Read Evidence Vault','View evidence metadata and authorized evidence.','LOW'),
('evidence.upload','EVIDENCE','Upload evidence','Upload governed evidence to private R2 storage.','HIGH'),
('design.read','DESIGN','Read designs','View design and artwork-version records.','LOW'),
('design.manage','DESIGN','Manage designs','Create/update design and artwork workflow metadata.','HIGH'),
('product.read','PRODUCT','Read products','View products, variants and SKU data.','LOW'),
('product.manage','PRODUCT','Manage products','Create/update products, variants and SKU mappings.','HIGH'),
('production.read','PRODUCTION','Read production','View production profiles, samples and manufacturing data.','LOW'),
('production.manage','PRODUCTION','Manage production','Manage production profiles, print/preflight and sample operations.','HIGH'),
('pricing.read','PRICING','Read pricing','View cost and margin models.','LOW'),
('pricing.approve','PRICING','Approve pricing','Approve pricing/margin decisions.','CRITICAL'),
('marketing.read','MARKETING','Read marketing intelligence','View psychographic, hypothesis, experiment and learning data.','LOW'),
('marketing.manage','MARKETING','Manage marketing intelligence','Create psychographic segments, hypotheses and experiment drafts.','HIGH'),
('marketing.review','MARKETING','Marketing council review','Record governed marketing psychology council reviews.','HIGH'),
('marketing.experiment','MARKETING','Run experiments','Start/complete approved marketing experiments.','HIGH'),
('marketing.learning.approve','MARKETING','Approve reusable learning','Promote measured experiment evidence into reusable marketing learning.','HIGH'),
('listing.read','MARKETPLACE','Read listings','View listing and platform-readiness data.','LOW'),
('listing.manage','MARKETPLACE','Manage listings','Create/update listing packages and platform-readiness data.','HIGH'),
('audit.read','AUDIT','Read audit ledger','View immutable operational audit history.','MEDIUM'),
('admin.users.read','ADMIN','Read users','View application identities and role assignments.','HIGH'),
('admin.users.manage','ADMIN','Manage users','Create, activate, suspend and disable application users.','CRITICAL'),
('admin.roles.read','ADMIN','Read roles','View roles and permission mappings.','MEDIUM'),
('admin.roles.manage','ADMIN','Manage entitlements','Assign/revoke approved roles and scoped entitlements.','CRITICAL'),
('security.read','SECURITY','Read security controls','View security posture and control configuration.','HIGH'),
('security.manage','SECURITY','Manage security controls','Manage application security configuration within change controls.','CRITICAL'),
('help.read','HELP','Read Help Center','View Help & Training Center content.','LOW'),
('help.manage','HELP','Manage Help Center','Publish and revise governed Help Center content.','MEDIUM');

-- Super User receives all application permissions. There is deliberately no permission to delete audit events.
INSERT OR IGNORE INTO role_permissions(role_code, permission_code)
SELECT 'SUPER_USER', code FROM permissions;

-- Executive owner: broad business control, no low-level security administration requirement.
INSERT OR IGNORE INTO role_permissions(role_code, permission_code)
SELECT 'OWNER_EXECUTIVE', code FROM permissions
WHERE code NOT IN ('admin.roles.manage','security.manage');

INSERT OR IGNORE INTO role_permissions(role_code, permission_code) VALUES
('BRAND_CREATIVE','dashboard.read'),('BRAND_CREATIVE','workflow.read'),('BRAND_CREATIVE','workflow.create'),('BRAND_CREATIVE','gate.read'),('BRAND_CREATIVE','gate.review.brand'),('BRAND_CREATIVE','evidence.read'),('BRAND_CREATIVE','evidence.upload'),('BRAND_CREATIVE','design.read'),('BRAND_CREATIVE','design.manage'),('BRAND_CREATIVE','product.read'),('BRAND_CREATIVE','marketing.read'),('BRAND_CREATIVE','help.read'),
('LEGAL_RISK','dashboard.read'),('LEGAL_RISK','workflow.read'),('LEGAL_RISK','gate.read'),('LEGAL_RISK','gate.review.legal'),('LEGAL_RISK','gate.evaluate'),('LEGAL_RISK','evidence.read'),('LEGAL_RISK','audit.read'),('LEGAL_RISK','product.read'),('LEGAL_RISK','marketing.read'),('LEGAL_RISK','marketing.review'),('LEGAL_RISK','help.read'),
('PRODUCTION_OPS','dashboard.read'),('PRODUCTION_OPS','workflow.read'),('PRODUCTION_OPS','workflow.manage'),('PRODUCTION_OPS','gate.read'),('PRODUCTION_OPS','gate.review.production'),('PRODUCTION_OPS','evidence.read'),('PRODUCTION_OPS','evidence.upload'),('PRODUCTION_OPS','product.read'),('PRODUCTION_OPS','product.manage'),('PRODUCTION_OPS','production.read'),('PRODUCTION_OPS','production.manage'),('PRODUCTION_OPS','pricing.read'),('PRODUCTION_OPS','help.read'),
('QUALITY_ASSURANCE','dashboard.read'),('QUALITY_ASSURANCE','workflow.read'),('QUALITY_ASSURANCE','gate.read'),('QUALITY_ASSURANCE','gate.review.production'),('QUALITY_ASSURANCE','evidence.read'),('QUALITY_ASSURANCE','evidence.upload'),('QUALITY_ASSURANCE','product.read'),('QUALITY_ASSURANCE','production.read'),('QUALITY_ASSURANCE','production.manage'),('QUALITY_ASSURANCE','audit.read'),('QUALITY_ASSURANCE','help.read'),
('FINANCE_PRICING','dashboard.read'),('FINANCE_PRICING','workflow.read'),('FINANCE_PRICING','gate.read'),('FINANCE_PRICING','gate.review.finance'),('FINANCE_PRICING','gate.evaluate'),('FINANCE_PRICING','product.read'),('FINANCE_PRICING','pricing.read'),('FINANCE_PRICING','pricing.approve'),('FINANCE_PRICING','audit.read'),('FINANCE_PRICING','help.read'),
('GROWTH_CRM','dashboard.read'),('GROWTH_CRM','workflow.read'),('GROWTH_CRM','gate.read'),('GROWTH_CRM','evidence.read'),('GROWTH_CRM','product.read'),('GROWTH_CRM','marketing.read'),('GROWTH_CRM','marketing.manage'),('GROWTH_CRM','marketing.review'),('GROWTH_CRM','marketing.experiment'),('GROWTH_CRM','marketing.learning.approve'),('GROWTH_CRM','listing.read'),('GROWTH_CRM','help.read'),
('MARKETPLACE_OPS','dashboard.read'),('MARKETPLACE_OPS','workflow.read'),('MARKETPLACE_OPS','gate.read'),('MARKETPLACE_OPS','gate.review.marketplace'),('MARKETPLACE_OPS','evidence.read'),('MARKETPLACE_OPS','product.read'),('MARKETPLACE_OPS','pricing.read'),('MARKETPLACE_OPS','listing.read'),('MARKETPLACE_OPS','listing.manage'),('MARKETPLACE_OPS','help.read'),
('ENGINEERING_ADMIN','dashboard.read'),('ENGINEERING_ADMIN','workflow.read'),('ENGINEERING_ADMIN','gate.read'),('ENGINEERING_ADMIN','evidence.read'),('ENGINEERING_ADMIN','design.read'),('ENGINEERING_ADMIN','product.read'),('ENGINEERING_ADMIN','production.read'),('ENGINEERING_ADMIN','pricing.read'),('ENGINEERING_ADMIN','marketing.read'),('ENGINEERING_ADMIN','listing.read'),('ENGINEERING_ADMIN','audit.read'),('ENGINEERING_ADMIN','admin.users.read'),('ENGINEERING_ADMIN','admin.users.manage'),('ENGINEERING_ADMIN','admin.roles.read'),('ENGINEERING_ADMIN','admin.roles.manage'),('ENGINEERING_ADMIN','security.read'),('ENGINEERING_ADMIN','security.manage'),('ENGINEERING_ADMIN','help.read'),('ENGINEERING_ADMIN','help.manage'),
('AUDITOR_READONLY','dashboard.read'),('AUDITOR_READONLY','workflow.read'),('AUDITOR_READONLY','gate.read'),('AUDITOR_READONLY','evidence.read'),('AUDITOR_READONLY','design.read'),('AUDITOR_READONLY','product.read'),('AUDITOR_READONLY','production.read'),('AUDITOR_READONLY','pricing.read'),('AUDITOR_READONLY','marketing.read'),('AUDITOR_READONLY','listing.read'),('AUDITOR_READONLY','audit.read'),('AUDITOR_READONLY','help.read');

INSERT OR IGNORE INTO sod_rules(code,name,description,enforcement) VALUES
('SOD-CREATOR-FINAL-RELEASE','Creator cannot be sole final releaser','The person who creates or materially authors a release case must not be the sole final release approver.','DUAL_APPROVAL'),
('SOD-LEGAL-INDEPENDENCE','Legal review independence','Legal/IP/claims decisions must be made by an entitled Legal/Risk reviewer; AI recommendations cannot constitute final legal clearance.','BLOCK'),
('SOD-QA-FAILURE','Failed QA cannot self-clear','A production/sample QA failure cannot be cleared solely by the person who performed the failed production operation.','DUAL_APPROVAL'),
('SOD-AUDIT-IMMUTABLE','Audit history is immutable','No role, including Super User, may delete or rewrite audit history through the application. Corrections require new append-only events.','BLOCK'),
('SOD-OVERRIDE-VISIBLE','Overrides must remain visible','Governance exceptions require explicit rationale, risk acceptance, approver, expiration/review date and audit evidence.','BLOCK');
