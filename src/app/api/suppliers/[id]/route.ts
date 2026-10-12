import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

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
// PUT /api/suppliers/[id] — Yetkazib beruvchini yangilash
// ═══════════════════════════════════════════════════════════
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeId = await getStoreId(session.user.id);
  if (!storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  const { id } = await params;

  // ⚠️ FAQAT SHU DO'KON YETKAZIB BERUVCHISI
  const existing = await prisma.supplier.findFirst({
    where: { id, storeId },  // ← storeId tekshirish
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Yetkazib beruvchi topilmadi" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ supplier });
}

// ═══════════════════════════════════════════════════════════
// DELETE /api/suppliers/[id] — Yetkazib beruvchini o'chirish
// ═══════════════════════════════════════════════════════════
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeId = await getStoreId(session.user.id);
  if (!storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  const { id } = await params;

  // ⚠️ FAQAT SHU DO'KON YETKAZIB BERUVCHISI
  const existing = await prisma.supplier.findFirst({
    where: { id, storeId },  // ← storeId tekshirish
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Yetkazib beruvchi topilmadi" },
      { status: 404 }
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}