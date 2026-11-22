import type { Env, MinimalExecutionContext } from "../types";

export interface AuthenticatedActor {
  email: string;
  role: "OWNER" | "USER";
}

export async function requireActor(
  env: Env,
  ctx: MinimalExecutionContext,
): Promise<AuthenticatedActor> {
  if (!ctx.access) {
    throw new Response("Cloudflare Access authentication required", { status: 401 });
  }
  const identity = await ctx.access.getIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email) {
    throw new Response("Authenticated identity has no email", { status: 403 });
  }

  const owner = env.OWNER_EMAIL.trim().toLowerCase();
  return { email, role: owner && email === owner ? "OWNER" : "USER" };
}

export function requireOwner(actor: AuthenticatedActor): void {
  if (actor.role !== "OWNER") {
    throw new Response("Owner permission required", { status: 403 });
  }
}
