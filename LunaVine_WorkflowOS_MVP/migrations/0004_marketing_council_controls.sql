PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS marketing_council_roles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  mandatory INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marketing_policy_controls (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  control_statement TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  blocking INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO marketing_council_roles (id,code,name,purpose,mandatory,created_at,updated_at) VALUES
('mcr_consumer_psych','CONSUMER_PSYCHOLOGIST','Consumer Psychologist','Assess motivation, cognition, decision behavior and whether the proposed mechanism is plausible without overstating causality.',0,datetime('now'),datetime('now')),
('mcr_brand','PREMIUM_BRAND_STRATEGIST','Premium Brand Strategist','Protect Luna Vine quiet-luxury positioning, signature codes, tone and long-term brand equity.',1,datetime('now'),datetime('now')),
('mcr_growth','GROWTH_CRO_SPECIALIST','Growth/CRO Specialist','Assess conversion hypothesis, experiment design, primary metric and commercial guardrails.',0,datetime('now'),datetime('now')),
('mcr_voice','CUSTOMER_VOICE_ANALYST','Customer Voice Analyst','Ground assumptions in real customer reviews, interviews, search behavior, support data and observed behavior.',0,datetime('now'),datetime('now')),
('mcr_adversarial','ADVERSARIAL_REVIEWER','Adversarial Reviewer','Challenge unsupported inference, alternative explanations, unintended consequences and measurement weaknesses.',0,datetime('now'),datetime('now')),
('mcr_ethics','ETHICS_COMPLIANCE_REVIEWER','Ethics & Compliance Reviewer','Block dark patterns, deceptive persuasion, exploitative targeting, hidden consent and unsupported urgency or proof.',1,datetime('now'),datetime('now'));

INSERT OR IGNORE INTO marketing_policy_controls (id,code,name,control_statement,severity,blocking,created_at,updated_at) VALUES
('mpc_fake_scarcity','NO_FAKE_SCARCITY','No fake scarcity','Scarcity, countdowns, limited-stock or limited-time claims must be true, current, and supported by verifiable operational evidence.','CRITICAL',1,datetime('now'),datetime('now')),
('mpc_fake_social','NO_FAKE_SOCIAL_PROOF','No fabricated social proof','Reviews, testimonials, purchase counts, popularity statements, endorsements and community claims must be genuine and appropriately permissioned.','CRITICAL',1,datetime('now'),datetime('now')),
('mpc_hidden_consent','NO_HIDDEN_CONSENT','No hidden consent','Marketing consent may not be preselected, bundled deceptively, or obscured. Opt-out and preference controls must be honored.','CRITICAL',1,datetime('now'),datetime('now')),
('mpc_deceptive_price','NO_DECEPTIVE_PRICING','No deceptive pricing','Reference prices, discounts, savings, bundles and urgency must be factually and legally supportable.','CRITICAL',1,datetime('now'),datetime('now')),
('mpc_vulnerability','NO_EXPLOITATIVE_VULNERABILITY','No exploitative vulnerability targeting','Do not exploit insecurity, grief, health, financial stress, children, or other vulnerability to pressure a purchase.','CRITICAL',1,datetime('now'),datetime('now')),
('mpc_protected','PROTECTED_ATTRIBUTE_GUARDRAIL','Protected-attribute guardrail','Do not infer or target sensitive/protected attributes unless a documented lawful, ethical and platform-compliant basis exists.','CRITICAL',1,datetime('now'),datetime('now')),
('mpc_fear_shame','NO_COERCIVE_FEAR_SHAME','No coercive fear or shame','Do not use shame, humiliation, threats, or exaggerated fear to pressure purchase or retention.','HIGH',1,datetime('now'),datetime('now')),
('mpc_endorsement','ENDORSEMENT_DISCLOSURE','Endorsement disclosure','Paid, gifted, affiliate, creator and influencer relationships must be disclosed as required and supported by rights/contract evidence.','HIGH',1,datetime('now'),datetime('now')),
('mpc_claims','CLAIMS_REQUIRE_EVIDENCE','Claims require evidence','Material product, sustainability, performance, certification, women-owned status, comparative or outcome claims require appropriate evidence before publication.','CRITICAL',1,datetime('now'),datetime('now'));
