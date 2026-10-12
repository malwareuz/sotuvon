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
// GET /api/customers/duplicates
// Returns groups of customers that share the same phone number (non-null)
// ═══════════════════════════════════════════════════════════
export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId) {
      return NextResponse.json(
        { error: "Avtorizatsiya talab qilinadi" },
        { status: 401 }
      );
    }

    // ⚠️ FAQAT SHU DO'KON MIJOZLARI
    // Find phone numbers that appear more than once
    const phoneCounts = await prisma.customer.groupBy({
      by: ["phone"],
      where: {
        storeId,                    // ← FAQAT SHU DO'KON
        phone: { not: null },
      },
      _count: { phone: true },
      having: { phone: { _count: { gt: 1 } } },
    });

    if (phoneCounts.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const duplicatePhones = phoneCounts.map((g) => g.phone as string);

    const customers = await prisma.customer.findMany({
      where: {
        storeId,                    // ← FAQAT SHU DO'KON
        phone: { in: duplicatePhones },
      },
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by phone
    const grouped: Record<string, typeof customers> = {};
    for (const c of customers) {
      const phone = c.phone!;
      if (!grouped[phone]) grouped[phone] = [];
      grouped[phone].push(c);
    }

    const groups = Object.entries(grouped).map(([phone, members]) => ({
      phone,
      customers: serialize(
        members.map((m) => ({ ...m, salesCount: m._count.sales }))
      ),
    }));

    return NextResponse.json({ groups });
  } catch (err: any) {
    console.error("[customers/duplicates]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}