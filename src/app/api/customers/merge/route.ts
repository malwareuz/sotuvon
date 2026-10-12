import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ═══════════════════════════════════════════════════════════
// STORE'NI OLISH
// ═══════════════════════════════════════════════════════════
async function getStoreId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeId: true },
  });

  return user?.storeId ?? null;
}

// ═══════════════════════════════════════════════════════════
// POST /api/customers/merge
// ═══════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const storeId = await getStoreId();
    if (!storeId) {
      return NextResponse.json(
        { error: "Avtorizatsiya talab qilinadi" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { keepId, mergeId } = body as { keepId: string; mergeId: string };

    if (!keepId || !mergeId) {
      return NextResponse.json(
        { error: "keepId and mergeId are required" },
        { status: 400 }
      );
    }
    if (keepId === mergeId) {
      return NextResponse.json(
        { error: "keepId and mergeId must be different" },
        { status: 400 }
      );
    }

    // ⚠️ FAQAT SHU DO'KON MIJOZLARI
    const [keepCustomer, mergeCustomer] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: keepId, storeId },  // ← storeId tekshirish
      }),
      prisma.customer.findFirst({
        where: { id: mergeId, storeId },  // ← storeId tekshirish
      }),
    ]);

    if (!keepCustomer) {
      return NextResponse.json(
        { error: "Keep customer not found" },
        { status: 404 }
      );
    }
    if (!mergeCustomer) {
      return NextResponse.json(
        { error: "Merge customer not found" },
        { status: 404 }
      );
    }

    // Run merge in a transaction
    await prisma.$transaction([
      // Reassign all sales from mergeId → keepId
      prisma.sale.updateMany({
        where: { customerId: mergeId, storeId },  // ← storeId
        data: { customerId: keepId },
      }),
      // Reassign all loyalty logs from mergeId → keepId
      prisma.loyaltyLog.updateMany({
        where: { customerId: mergeId, storeId },  // ← storeId
        data: { customerId: keepId },
      }),
      // Add loyalty points from the duplicate to the keeper
      prisma.customer.update({
        where: { id: keepId },
        data: { loyaltyPoints: { increment: mergeCustomer.loyaltyPoints } },
      }),
      // Delete the duplicate customer
      prisma.customer.delete({ where: { id: mergeId } }),
    ]);

    const updatedCustomer = await prisma.customer.findFirst({
      where: { id: keepId, storeId },
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (err: any) {
    console.error("[customers/merge]", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to merge" },
      { status: 500 }
    );
  }
}