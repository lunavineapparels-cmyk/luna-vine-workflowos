import type { Env } from "../types";
import { id } from "../core/ids";
import { audit } from "./audit";

export async function createOrUpdateUser(env:Env,input:{email:string;displayName?:string;status?:string;actorEmail:string}) {
  const email=input.email.trim().toLowerCase();
  const existing=await env.DB.prepare(`SELECT id,email,status FROM app_users WHERE lower(email)=?`).bind(email).first<any>();
  if(existing){
    await env.DB.prepare(`UPDATE app_users SET display_name=COALESCE(?,display_name),status=?,updated_at=datetime('now') WHERE id=?`).bind(input.displayName??null,input.status||existing.status,existing.id).run();
    await audit(env,{actorEmail:input.actorEmail,action:"USER_UPDATED",objectType:"APP_USER",objectId:existing.id,oldValue:existing,newValue:{email,status:input.status||existing.status,displayName:input.displayName}});
    return {id:existing.id};
  }
  const userId=id("usr");
  await env.DB.prepare(`INSERT INTO app_users(id,email,display_name,status,created_at,updated_at) VALUES(?,?,?,?,datetime('now'),datetime('now'))`).bind(userId,email,input.displayName??null,input.status||"ACTIVE").run();
  await audit(env,{actorEmail:input.actorEmail,action:"USER_CREATED",objectType:"APP_USER",objectId:userId,newValue:{email,status:input.status||"ACTIVE"}});
  return {id:userId};
}

export async function assignRole(env:Env,input:{userId:string;roleCode:string;reason:string;actorEmail:string;validTo?:string;scopeType?:string;scopeId?:string}) {
  const role=await env.DB.prepare(`SELECT code FROM roles WHERE code=?`).bind(input.roleCode).first<any>();
  if(!role) throw new Response("Unknown role",{status:400});
  const assignmentId=id("ur");
  await env.DB.prepare(`INSERT OR IGNORE INTO user_roles(id,user_id,role_code,scope_type,scope_id,valid_from,valid_to,assigned_by,assignment_reason,created_at) VALUES(?,?,?,?,?,datetime('now'),?,?,?,datetime('now'))`)
    .bind(assignmentId,input.userId,input.roleCode,input.scopeType||"GLOBAL",input.scopeId||null,input.validTo||null,input.actorEmail,input.reason).run();
  await audit(env,{actorEmail:input.actorEmail,action:"ROLE_ASSIGNED",objectType:"APP_USER",objectId:input.userId,newValue:{roleCode:input.roleCode,reason:input.reason,validTo:input.validTo||null}});
}

async function countActiveSuperUsers(env:Env):Promise<number>{
  const row=await env.DB.prepare(`SELECT COUNT(DISTINCT u.id) AS c FROM app_users u JOIN user_roles ur ON ur.user_id=u.id WHERE u.status='ACTIVE' AND ur.role_code='SUPER_USER' AND ur.valid_from<=datetime('now') AND (ur.valid_to IS NULL OR ur.valid_to>datetime('now'))`).first<{c:number}>();
  return Number(row?.c||0);
}

export async function revokeRole(env:Env,input:{userId:string;roleCode:string;actorEmail:string;reason:string}) {
  if(input.roleCode==="SUPER_USER"){
    const target=await env.DB.prepare(`SELECT status FROM app_users WHERE id=?`).bind(input.userId).first<any>();
    if(target?.status==="ACTIVE" && await countActiveSuperUsers(env)<=1) throw new Response("Cannot revoke the last active Super User",{status:409});
  }
  await env.DB.prepare(`DELETE FROM user_roles WHERE user_id=? AND role_code=?`).bind(input.userId,input.roleCode).run();
  await audit(env,{actorEmail:input.actorEmail,action:"ROLE_REVOKED",objectType:"APP_USER",objectId:input.userId,reason:input.reason,oldValue:{roleCode:input.roleCode}});
}

export async function setUserStatus(env:Env,input:{userId:string;status:string;actorEmail:string;reason:string}) {
  const user=await env.DB.prepare(`SELECT id,email,status FROM app_users WHERE id=?`).bind(input.userId).first<any>();
  if(!user) throw new Response("User not found",{status:404});
  if(input.status!=="ACTIVE"){
    const su=await env.DB.prepare(`SELECT 1 AS x FROM user_roles WHERE user_id=? AND role_code='SUPER_USER' LIMIT 1`).bind(input.userId).first<any>();
    if(su && user.status==="ACTIVE" && await countActiveSuperUsers(env)<=1) throw new Response("Cannot disable/suspend the last active Super User",{status:409});
  }
  await env.DB.prepare(`UPDATE app_users SET status=?,updated_at=datetime('now') WHERE id=?`).bind(input.status,input.userId).run();
  await audit(env,{actorEmail:input.actorEmail,action:"USER_STATUS_CHANGED",objectType:"APP_USER",objectId:input.userId,reason:input.reason,oldValue:{status:user.status},newValue:{status:input.status}});
}
