import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ═══════════════════════════════════════════════════════════
// SESSION VA STORE'NI OLISH
// ═══════════════════════════════════════════════════════════
async function getCtx() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, storeId: true },
  });

  if (!user?.storeId) return null;

  return { userId: user.id, storeId: user.storeId };
}

// ═══════════════════════════════════════════════════════════
// GET /api/held-orders
// ═══════════════════════════════════════════════════════════
export async function GET() {
  const ctx = await getCtx();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.heldOrder.findMany({
    where: {
      storeId: ctx.storeId,  // ← FAQAT SHU DO'KON
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// ═══════════════════════════════════════════════════════════
// POST /api/held-orders
// ═══════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const order = await prisma.heldOrder.create({
    data: {
      label: body.label ?? null,
      cartSnapshot: body.cartSnapshot,
      storeId: ctx.storeId,  // ← STORE ID QO'SHILDI
      userId: ctx.userId,    // ← USER ID QO'SHILDI
    },
  });

  return NextResponse.json(order, { status: 201 });
}

// ═══════════════════════════════════════════════════════════
// DELETE /api/held-orders
// ═══════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id majburiy" }, { status: 400 });
  }

  // Faqat shu do'konga tegishli savatni o'chirish
  await prisma.heldOrder.deleteMany({
    where: {
      id,
      storeId: ctx.storeId,  // ← FAQAT SHU DO'KON
    },
  });

  return NextResponse.json({ ok: true });
}