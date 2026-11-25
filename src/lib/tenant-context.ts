import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Resolves the tenant from the authenticated server-side session.
 * Never accept tenantId from request JSON, query strings, or client state.
 * This phase intentionally supports one tenant membership per user.
 */
export async function getTenantContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const membership = await prisma.tenantMember.findUnique({
    where: { userId: session.user.id },
    include: { tenant: true },
  });

  if (!membership) {
    throw new Error("TENANT_NOT_ASSIGNED");
  }

  return {
    userId: session.user.id,
    user: session.user,
    tenantId: membership.tenantId,
    tenant: membership.tenant,
    role: membership.role,
  };
}

export async function requireTenantId(): Promise<string> {
  const context = await getTenantContext();
  return context.tenantId;
}

export async function requireTenantAdmin() {
  const context = await getTenantContext();
  if (context.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return context;
}
