import { NextRequest, NextResponse } from "next/server";
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
// GET /api/loyalty?customerId=... — Sodiqlik balansi
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json(
      { error: "customerId required" },
      { status: 400 }
    );
  }

  const [customer, settings] = await Promise.all([
    // ⚠️ FAQAT SHU DO'KON MIJOZI
    prisma.customer.findFirst({
      where: { id: customerId, storeId },  // ← storeId
      select: { id: true, name: true, loyaltyPoints: true },
    }),
    // ⚠️ FAQAT SHU DO'KON SOZLAMALARI
    prisma.businessSettings.findFirst({
      where: { storeId },  // ← storeId
    }),
  ]);

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  const earnRate = parseFloat((settings?.loyaltyEarnRate ?? 1).toString());
  const redeemValue = parseFloat(
    (settings?.loyaltyRedeemValue ?? 100).toString()
  );

  return NextResponse.json({
    points: customer.loyaltyPoints,
    enabled: settings?.loyaltyEnabled ?? false,
    earnRate,
    redeemValue,
    // Dollar discount if they redeem all points
    maxRedeemDiscount: customer.loyaltyPoints / redeemValue,
  });
}