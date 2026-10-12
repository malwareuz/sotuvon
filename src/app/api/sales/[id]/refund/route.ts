import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const refundSchema = z.object({
  reason: z.string().optional(),
  restoreStock: z.boolean().default(true),
  items: z.array(z.object({
    saleItemId: z.string(),
    productId: z.string().nullable().optional(),
    name: z.string(),
    quantity: z.number().int().min(1),
    price: z.number(),
  })).min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ⚠️ STORE'NI OLISH
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

  const storeId = user.storeId;
  const { id: saleId } = await params;

  // ⚠️ FAQAT SHU DO'KON SAVDOSI
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, storeId },  // ← storeId tekshirish
    include: { items: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  if (sale.status !== "COMPLETED") {
    return NextResponse.json({ error: "Sale is not refundable" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { reason, restoreStock, items } = parsed.data;
  const refundAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const refund = await prisma.$transaction(async (tx) => {
    // 1. Refund yaratish
    const r = await tx.refund.create({
      data: {
        saleId,
        userId: session.user.id,
        storeId,                                    // ← storeId
        amount: refundAmount,
        reason: reason || null,
        items: items,
        restoreStock,
      },
    });

    // 2. Savdo statusini yangilash
    await tx.sale.update({
      where: { id: saleId, storeId },               // ← storeId
      data: { status: "REFUNDED" },
    });

    // 3. Stockni tiklash — FAQAT SHU DO'KON MAHSULOTLARI
    if (restoreStock) {
      for (const item of items) {
        if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId, storeId }, // ← storeId
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    return r;
  });

  return NextResponse.json({ refund });
}