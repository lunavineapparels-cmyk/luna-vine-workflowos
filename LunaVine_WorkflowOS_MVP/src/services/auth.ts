import type { Env, MinimalExecutionContext } from "../types";
import { id } from "../core/ids";
import { audit } from "./audit";

export interface AuthenticatedActor {
  userId: string;
  email: string;
  displayName?: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  roles: string[];
  permissions: Set<string>;
  isSuperUser: boolean;
}

async function ensureUser(env: Env, email: string, displayName?: string): Promise<{id:string;status:AuthenticatedActor["status"]}> {
  const owner = env.OWNER_EMAIL.trim().toLowerCase();
  let user = await env.DB.prepare(`SELECT id,status FROM app_users WHERE lower(email)=?`).bind(email).first<{id:string;status:AuthenticatedActor["status"]}>();
  if (!user) {
    const userId = id("usr");
    const status: AuthenticatedActor["status"] = email === owner ? "ACTIVE" : "PENDING";
    await env.DB.prepare(`INSERT INTO app_users(id,email,display_name,status,last_login_at,created_at,updated_at) VALUES(?,?,?,?,datetime('now'),datetime('now'),datetime('now'))`)
      .bind(userId,email,displayName ?? null,status).run();
    user = { id:userId, status };
    await audit(env,{actorEmail:email,action:"IDENTITY_PROVISIONED",objectType:"APP_USER",objectId:userId,newValue:{email,status}});
  } else {
    await env.DB.prepare(`UPDATE app_users SET last_login_at=datetime('now'), display_name=COALESCE(?,display_name), updated_at=datetime('now') WHERE id=?`).bind(displayName ?? null,user.id).run();
  }

  if (email === owner) {
    if (user.status !== "ACTIVE") {
      await env.DB.prepare(`UPDATE app_users SET status='ACTIVE',updated_at=datetime('now') WHERE id=?`).bind(user.id).run();
      user.status = "ACTIVE";
    }
    await env.DB.prepare(`INSERT OR IGNORE INTO user_roles(id,user_id,role_code,scope_type,scope_id,valid_from,assigned_by,assignment_reason,created_at) VALUES(?,?, 'SUPER_USER','GLOBAL',NULL,datetime('now'),?, 'OWNER_EMAIL bootstrap',datetime('now'))`)
      .bind(id("ur"),user.id,email).run();
  }
  return user;
}

export async function requireActor(env: Env, ctx: MinimalExecutionContext): Promise<AuthenticatedActor> {
  if (!ctx.access) throw new Response("Cloudflare Access authentication required", { status: 401 });
  const identity = await ctx.access.getIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email) throw new Response("Authenticated identity has no email", { status: 403 });

  const user = await ensureUser(env,email,identity?.name);
  if (user.status !== "ACTIVE") {
    throw new Response(`WorkflowOS entitlement is ${user.status}. Contact a Super User.`, { status: 403 });
  }

  const roleRows = await env.DB.prepare(`SELECT role_code FROM user_roles WHERE user_id=? AND valid_from<=datetime('now') AND (valid_to IS NULL OR valid_to>datetime('now'))`).bind(user.id).all<{role_code:string}>();
  const roles = roleRows.results.map(r=>r.role_code);
  const permRows = await env.DB.prepare(`SELECT DISTINCT rp.permission_code FROM role_permissions rp JOIN user_roles ur ON ur.role_code=rp.role_code WHERE ur.user_id=? AND ur.valid_from<=datetime('now') AND (ur.valid_to IS NULL OR ur.valid_to>datetime('now'))`).bind(user.id).all<{permission_code:string}>();
  const permissions = new Set(permRows.results.map(r=>r.permission_code));
  return {userId:user.id,email,displayName:identity?.name,status:user.status,roles,permissions,isSuperUser:roles.includes("SUPER_USER")};
}

export function hasPermission(actor: AuthenticatedActor, permission: string): boolean {
  return actor.permissions.has(permission);
}

export function requirePermission(actor: AuthenticatedActor, permission: string): void {
  if (!hasPermission(actor, permission)) {
    throw new Response(`Permission required: ${permission}`, { status: 403 });
  }
}

export function requireAnyPermission(actor: AuthenticatedActor, permissions: string[]): void {
  if (!permissions.some(p=>actor.permissions.has(p))) {
    throw new Response(`One of these permissions is required: ${permissions.join(", ")}`, { status: 403 });
  }
}

export function gateReviewPermission(gateCode: string): string {
  const code = gateCode.toUpperCase();
  if (["LEGAL_IP","CLAIMS_EVIDENCE","CULTURAL_REVIEW","CHILDRENS_PRODUCT_SAFETY","PRIVACY_SECURITY"].includes(code)) return "gate.review.legal";
  if (["PRICING_MARGIN"].includes(code)) return "gate.review.finance";
  if (["LISTING_PACKAGE","PLATFORM_READINESS","SHIPPING_RETURNS"].includes(code)) return "gate.review.marketplace";
  if (["SUPPLIER","SAMPLE_QA","MOCKUP_RIGHTS","MOCKUP_ACCURACY","SKU_MAPPING","PRODUCTION_PREFLIGHT","DTF_GANG_SHEET_PREFLIGHT"].includes(code)) return "gate.review.production";
  if (code === "FINAL_HUMAN_REVIEW") return "release.final_approve";
  return "gate.review.brand";
}
