import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const adjustSchema = z.object({
  productId: z.string(),
  delta: z.number().int(),
  reason: z.enum(["RECEIVED", "DAMAGED", "THEFT", "CORRECTION", "OPENING_COUNT"]),
  note: z.string().optional(),
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
// POST /api/stock-adjustments — Yangi tuzatish
// ═══════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { productId, delta, reason, note } = parsed.data;

  // ⚠️ MAHSULOT SHU DO'KONGA TEGISHLI EKANLIGINI TEKSHIRISH
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { storeId: true },
  });

  if (!product || product.storeId !== storeId) {
    return NextResponse.json(
      { error: "Mahsulot topilmadi yoki boshqa do'konga tegishli" },
      { status: 404 }
    );
  }

  const [adjustment] = await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: {
        productId,
        userId: session.user.id,
        storeId,  // ← STORE ID QO'SHILDI
        delta,
        reason,
        note: note ?? null,
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: delta } },
    }),
  ]);

  return NextResponse.json({ adjustment });
}

// ═══════════════════════════════════════════════════════════
// GET /api/stock-adjustments — Tuzatishlar tarixi
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeId = await getStoreId(session.user.id);
  if (!storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  const productId = req.nextUrl.searchParams.get("productId");

  // ⚠️ FAQAT SHU DO'KON TUZATISHLARI
  const where = {
    storeId,
    ...(productId ? { productId } : {}),
  };

  const adjustments = await prisma.stockAdjustment.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ adjustments });
}