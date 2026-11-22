PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workflow_cases (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL,
  workflow_version TEXT NOT NULL,
  title TEXT NOT NULL,
  accountable_email TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  risk_level TEXT NOT NULL DEFAULT 'MEDIUM',
  product_id TEXT,
  release_decision TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_status ON workflow_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_release ON workflow_cases(release_decision);

CREATE TABLE IF NOT EXISTS gate_definitions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  risk_severity TEXT NOT NULL DEFAULT 'MEDIUM',
  blocking INTEGER NOT NULL DEFAULT 1,
  default_required INTEGER NOT NULL DEFAULT 0,
  override_allowed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS case_gates (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES workflow_cases(id),
  gate_definition_id TEXT NOT NULL REFERENCES gate_definitions(id),
  result TEXT NOT NULL DEFAULT 'NOT_STARTED',
  required INTEGER NOT NULL DEFAULT 1,
  reviewer_email TEXT,
  notes TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(case_id, gate_definition_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES workflow_cases(id),
  title TEXT NOT NULL,
  assigned_role TEXT,
  assigned_email TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  due_at TEXT,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES workflow_cases(id),
  evidence_type TEXT NOT NULL,
  source TEXT,
  file_name TEXT,
  object_key TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  checksum_sha256 TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  expires_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_checksum ON evidence(checksum_sha256, object_key);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  reason TEXT,
  old_json TEXT,
  new_json TEXT,
  correlation_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_object ON audit_events(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_audit_corr ON audit_events(correlation_id);

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  collection TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  artwork_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artwork_versions (
  id TEXT PRIMARY KEY,
  design_id TEXT NOT NULL REFERENCES designs(id),
  version_number INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  object_key TEXT NOT NULL,
  drive_file_id TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(design_id, version_number)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  design_id TEXT REFERENCES designs(id),
  parent_sku TEXT UNIQUE,
  supplier TEXT,
  supplier_product_id TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_sku TEXT NOT NULL UNIQUE,
  color TEXT,
  size TEXT,
  fit TEXT,
  decoration_method TEXT,
  placement TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS production_profiles (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  scaling_mode TEXT NOT NULL,
  print_width_in REAL,
  print_height_in REAL,
  pixel_width INTEGER,
  pixel_height INTEGER,
  effective_dpi REAL,
  safe_margin_in REAL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS samples (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  supplier TEXT NOT NULL,
  score REAL,
  status TEXT NOT NULL DEFAULT 'ORDERED',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_models (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  currency TEXT NOT NULL DEFAULT 'USD',
  base_cost REAL,
  print_cost REAL,
  shipping_cost REAL,
  marketplace_fees REAL,
  packaging_cost REAL,
  advertising_allowance REAL,
  retail_price REAL,
  contribution_margin_pct REAL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS configuration_versions (
  id TEXT PRIMARY KEY,
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  version INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  rationale TEXT,
  owner_email TEXT NOT NULL,
  approved_by TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(config_key, version)
);
