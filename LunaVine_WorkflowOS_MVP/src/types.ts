export type CaseStatus =
  | "DRAFT"
  | "INTAKE_VALIDATION"
  | "READY"
  | "IN_PROGRESS"
  | "REVIEW"
  | "APPROVAL"
  | "EXECUTION"
  | "VERIFICATION"
  | "COMPLETED"
  | "HOLD"
  | "REVISION_REQUIRED"
  | "ESCALATED"
  | "REJECTED"
  | "CANCELLED"
  | "ARCHIVED";

export type GateResult = "NOT_STARTED" | "PASS" | "FAIL" | "HOLD" | "N_A";
export type ReleaseDecision =
  | "RELEASE_READY"
  | "MINOR_FIX_REQUIRED"
  | "HOLD"
  | "REVISE"
  | "REJECT"
  | "ESCALATE";

export interface AccessIdentity {
  email?: string;
  name?: string;
  groups?: string[];
}

export interface AccessContext {
  aud: string;
  getIdentity(): Promise<AccessIdentity | null>;
}

export interface MinimalExecutionContext {
  access?: AccessContext;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  exports?: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta?: Record<string, unknown> }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: Record<string, unknown>): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: Record<string, unknown> } | null>;
  delete(key: string): Promise<void>;
}

export interface WorkflowBinding<T = unknown> {
  create(options?: { id?: string; params?: T }): Promise<{ id: string }>;
  get(id: string): Promise<{ id: string; status(): Promise<unknown>; sendEvent?(event: unknown): Promise<void> }>;
}

export interface Env {
  DB: D1Database;
  EVIDENCE: R2Bucket;
  PRODUCT_RELEASE_WORKFLOW: WorkflowBinding<{ caseId: string; actorEmail: string }>;
  APP_NAME: string;
  ENVIRONMENT: string;
  OWNER_EMAIL: string;
}

export interface GateEvaluationInput {
  code: string;
  blocking: boolean;
  result: GateResult;
  riskSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}
