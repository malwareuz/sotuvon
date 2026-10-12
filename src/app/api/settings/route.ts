import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";

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
// GET /api/settings — Do'kon sozlamalari
// ═══════════════════════════════════════════════════════════
export async function GET() {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ⚠️ FAQAT SHU DO'KON SOZLAMALARI
  const settings = await prisma.businessSettings.findFirst({
    where: { storeId },  // ← storeId
  });

  if (!settings) {
    return NextResponse.json({});
  }

  const s = serialize(settings);

  return NextResponse.json({
    name: s.name,
    logoUrl: s.logoUrl,
    currency: s.currency,
    currencyDecimals: s.currencyDecimals,
    taxName: s.taxName,
    receiptFooter: s.receiptFooter,
  });
}