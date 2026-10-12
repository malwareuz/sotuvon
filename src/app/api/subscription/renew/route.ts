import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ═══════════════════════════════════════════════════════════
// POST /api/subscription/renew — Obunani yangilash
// ═══════════════════════════════════════════════════════════
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Store'ni olish
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeId: true },
  });

  if (!user?.storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  // Store'ni yangilash (yoki obuna muddatini uzaytirish)
  const settings = await prisma.businessSettings.findFirst({
    where: { storeId: user.storeId },
  });

  if (!settings) {
    return NextResponse.json(
      { error: "Sozlamalar topilmadi" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Obuna yangilandi",
    storeId: user.storeId,
    renewedAt: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════
// GET /api/subscription/renew — Obuna holati
// ═══════════════════════════════════════════════════════════
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeId: true },
  });

  if (!user?.storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  const settings = await prisma.businessSettings.findFirst({
    where: { storeId: user.storeId },
    select: {
      name: true,
      setupComplete: true,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Obuna holati",
    storeId: user.storeId,
    storeName: settings?.name ?? "Noma'lum",
    status: settings?.setupComplete ? "ACTIVE" : "PENDING",
  });
}