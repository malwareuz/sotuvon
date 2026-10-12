import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ═══════════════════════════════════════════════════════════
// STORE'NI OLISH
// ═══════════════════════════════════════════════════════════
async function getStoreId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storeId: true },
  });
  return user?.storeId ?? null;
}

// ═══════════════════════════════════════════════════════════
// GET /api/users — Foydalanuvchilar ro'yxati (ADMIN)
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ⚠️ FAQAT SHU DO'KON FOYDALANUVCHILARI
  const storeId = await getStoreId(session.user.id);
  if (!storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      where: { storeId },                                   // ← storeId
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch users";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}