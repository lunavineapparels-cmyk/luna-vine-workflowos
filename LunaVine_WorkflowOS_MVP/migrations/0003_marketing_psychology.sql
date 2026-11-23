PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS marketing_psych_models (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  principle TEXT NOT NULL,
  ethical_boundary TEXT NOT NULL,
  default_risk TEXT NOT NULL DEFAULT 'LOW',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS psychographic_segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  lifecycle_stage TEXT,
  values_json TEXT NOT NULL DEFAULT '[]',
  desires_json TEXT NOT NULL DEFAULT '[]',
  frustrations_json TEXT NOT NULL DEFAULT '[]',
  triggers_json TEXT NOT NULL DEFAULT '[]',
  objections_json TEXT NOT NULL DEFAULT '[]',
  preferred_tone_json TEXT NOT NULL DEFAULT '[]',
  avoid_json TEXT NOT NULL DEFAULT '[]',
  evidence_quality TEXT NOT NULL DEFAULT 'HYPOTHESIS',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_psych_segments_status ON psychographic_segments(status);

CREATE TABLE IF NOT EXISTS marketing_hypotheses (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES workflow_cases(id),
  product_id TEXT REFERENCES products(id),
  segment_id TEXT REFERENCES psychographic_segments(id),
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  proposed_intervention TEXT NOT NULL,
  behavioral_models_json TEXT NOT NULL DEFAULT '[]',
  primary_metric TEXT NOT NULL,
  guardrails_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  risk_level TEXT NOT NULL DEFAULT 'MEDIUM',
  ethics_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  brand_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  legal_status TEXT NOT NULL DEFAULT 'N_A',
  claims_status TEXT NOT NULL DEFAULT 'N_A',
  cultural_status TEXT NOT NULL DEFAULT 'N_A',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketing_hyp_status ON marketing_hypotheses(status);
CREATE INDEX IF NOT EXISTS idx_marketing_hyp_segment ON marketing_hypotheses(segment_id);

CREATE TABLE IF NOT EXISTS marketing_council_reviews (
  id TEXT PRIMARY KEY,
  hypothesis_id TEXT NOT NULL REFERENCES marketing_hypotheses(id),
  reviewer_role TEXT NOT NULL,
  reviewer_type TEXT NOT NULL DEFAULT 'HUMAN_OR_AI',
  verdict TEXT NOT NULL,
  score REAL,
  rationale TEXT NOT NULL,
  risk_flags_json TEXT NOT NULL DEFAULT '[]',
  reviewer_email TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketing_reviews_hyp ON marketing_council_reviews(hypothesis_id);

CREATE TABLE IF NOT EXISTS marketing_experiments (
  id TEXT PRIMARY KEY,
  hypothesis_id TEXT NOT NULL REFERENCES marketing_hypotheses(id),
  channel TEXT NOT NULL,
  audience_description TEXT,
  control_json TEXT NOT NULL,
  variant_json TEXT NOT NULL,
  primary_metric TEXT NOT NULL,
  guardrails_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  started_at TEXT,
  ended_at TEXT,
  sample_size INTEGER,
  results_json TEXT,
  decision TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketing_exp_hyp ON marketing_experiments(hypothesis_id);

CREATE TABLE IF NOT EXISTS marketing_learning_registry (
  id TEXT PRIMARY KEY,
  hypothesis_id TEXT NOT NULL REFERENCES marketing_hypotheses(id),
  experiment_id TEXT REFERENCES marketing_experiments(id),
  learning TEXT NOT NULL,
  confidence TEXT NOT NULL,
  evidence_quality TEXT NOT NULL,
  reusable INTEGER NOT NULL DEFAULT 0,
  applicability TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketing_learning_hyp ON marketing_learning_registry(hypothesis_id);

CREATE TABLE IF NOT EXISTS marketing_skill_runs (
  id TEXT PRIMARY KEY,
  hypothesis_id TEXT REFERENCES marketing_hypotheses(id),
  segment_id TEXT REFERENCES psychographic_segments(id),
  skill_code TEXT NOT NULL DEFAULT 'SKILL-MKT-001',
  skill_version TEXT NOT NULL DEFAULT '1.0',
  input_json TEXT NOT NULL,
  models_considered_json TEXT NOT NULL DEFAULT '[]',
  models_selected_json TEXT NOT NULL DEFAULT '[]',
  recommendation_json TEXT NOT NULL,
  risk_summary_json TEXT NOT NULL DEFAULT '[]',
  actor_email TEXT NOT NULL,
  model_provider TEXT,
  model_name TEXT,
  prompt_version TEXT,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO marketing_psych_models
(id,code,name,category,principle,ethical_boundary,default_risk,created_at,updated_at) VALUES
('mpm_identity','IDENTITY_MOTIVATION','Identity-based motivation','Identity','People are more likely to act when the choice coheres with the identity they want to express.','Do not exploit protected traits or imply that purchase determines a person''s worth.','MEDIUM',datetime('now'),datetime('now')),
('mpm_self_consistency','SELF_CONSISTENCY','Self-consistency','Identity','People prefer choices that feel consistent with prior commitments, values, and self-image.','Never shame customers for changing their mind or declining a purchase.','LOW',datetime('now'),datetime('now')),
('mpm_social_proof','SOCIAL_PROOF','Social proof','Social','Evidence that similar people chose or valued something can reduce uncertainty.','Only use real, attributable reviews, counts, or customer behavior; never fabricate proof.','MEDIUM',datetime('now'),datetime('now')),
('mpm_authority','AUTHORITY','Authority','Social','Credible expertise can reduce uncertainty in complex decisions.','Do not imply credentials, endorsements, or certifications that do not exist.','MEDIUM',datetime('now'),datetime('now')),
('mpm_reciprocity','RECIPROCITY','Reciprocity','Social','Receiving genuine value can increase willingness to reciprocate.','Value must be real and must not create coercive obligation.','LOW',datetime('now'),datetime('now')),
('mpm_commitment','COMMITMENT','Commitment and consistency','Behavior','Small voluntary commitments can increase follow-through.','Commitments must be reversible; no hidden opt-ins or forced continuity.','MEDIUM',datetime('now'),datetime('now')),
('mpm_framing','FRAMING','Framing','Decision','How truthful information is framed changes which aspects feel salient.','Do not omit material facts or frame information deceptively.','MEDIUM',datetime('now'),datetime('now')),
('mpm_anchoring','ANCHORING','Anchoring','Pricing','An initial reference point can influence later judgments of price or value.','Reference prices must be genuine and legally defensible; no fake MSRP or deceptive strike-through pricing.','HIGH',datetime('now'),datetime('now')),
('mpm_loss_aversion','LOSS_AVERSION','Loss aversion','Decision','Potential losses can feel more salient than equivalent gains.','Do not weaponize fear, insecurity, or misleading deadlines.','HIGH',datetime('now'),datetime('now')),
('mpm_scarcity','SCARCITY','Scarcity','Decision','Genuine constrained availability can increase perceived urgency.','Only use scarcity when inventory, time, or capacity is actually constrained and verifiable.','HIGH',datetime('now'),datetime('now')),
('mpm_default','DEFAULT_EFFECT','Default effect','Choice Architecture','People often retain a preselected option.','No prechecked paid add-ons, marketing consent, or manipulative defaults.','HIGH',datetime('now'),datetime('now')),
('mpm_choice_overload','CHOICE_OVERLOAD','Choice overload','Choice Architecture','Too many similar choices can make decisions harder.','Simplify navigation without hiding materially relevant alternatives.','LOW',datetime('now'),datetime('now')),
('mpm_decoy','DECOY_EFFECT','Decoy effect','Pricing','A third option can change the relative attractiveness of other choices.','All options must be genuine and reasonably purchasable, not fake comparison products.','HIGH',datetime('now'),datetime('now')),
('mpm_contrast','CONTRAST_EFFECT','Contrast effect','Perception','People judge an option partly relative to nearby alternatives.','Comparisons must be truthful, relevant, and not misleading.','MEDIUM',datetime('now'),datetime('now')),
('mpm_fluency','PROCESSING_FLUENCY','Processing fluency','Cognition','Information that is easier to understand can feel easier to trust and act on.','Clarity must not be used to conceal limitations or exclusions.','LOW',datetime('now'),datetime('now')),
('mpm_exposure','MERE_EXPOSURE','Mere exposure','Cognition','Familiarity can increase comfort and recognition over repeated exposures.','Respect frequency caps, consent, and customer attention.','LOW',datetime('now'),datetime('now')),
('mpm_peak_end','PEAK_END','Peak-end rule','Experience','Memorable peaks and the end of an experience disproportionately shape recall.','Do not manufacture emotional distress to make recovery feel better.','LOW',datetime('now'),datetime('now')),
('mpm_goal_gradient','GOAL_GRADIENT','Goal-gradient effect','Loyalty','Visible progress toward a legitimate goal can motivate completion.','Progress and rewards must be accurately represented and attainable.','MEDIUM',datetime('now'),datetime('now')),
('mpm_present_bias','PRESENT_BIAS','Present bias','Decision','Immediate benefits often receive more weight than delayed benefits.','Do not hide future costs, renewals, or obligations.','HIGH',datetime('now'),datetime('now')),
('mpm_endowment','ENDOWMENT','Endowment effect','Ownership','People often value things more once they feel a sense of ownership.','Trials, personalization, and previews must not create hidden obligations.','MEDIUM',datetime('now'),datetime('now')),
('mpm_story','NARRATIVE_TRANSPORT','Narrative transportation','Story','Meaningful stories can increase attention, memory, and emotional connection.','Stories about founders, customers, heritage, or impact must be truthful and appropriately permissioned.','MEDIUM',datetime('now'),datetime('now')),
('mpm_jtbd','JOBS_TO_BE_DONE','Jobs-to-be-Done framing','Research','Customers choose products to make progress in a particular situation, including functional, emotional, and social jobs.','Treat inferred jobs as hypotheses until supported by customer evidence.','LOW',datetime('now'),datetime('now')),
('mpm_reactance','REACTANCE','Psychological reactance','Behavior','People may resist when they feel their freedom to choose is threatened.','Avoid coercive copy, forced continuity, and false inevitability.','MEDIUM',datetime('now'),datetime('now')),
('mpm_reciprocal_value','VALUE_FIRST','Value-first exchange','Relationship','Useful education, service, or inspiration can build trust before asking for a sale.','Value should stand on its own and not disguise paid promotion or data collection.','LOW',datetime('now'),datetime('now'));
