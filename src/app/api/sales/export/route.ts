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
// GET /api/sales/export?from=&to=
// ═══════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // ⚠️ FAQAT SHU DO'KON SAVDOLARI
  const where: Record<string, unknown> = {
    storeId,                                              // ← storeId
  };

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const rows: string[] = [
    [
      "Sale ID",
      "Date",
      "Status",
      "Payment Method",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Items",
    ].join(","),
  ];

  for (const sale of sales) {
    const itemsSummary = sale.items
      .map((i) => `${i.quantity}x ${i.product?.name ?? i.name}`)
      .join("; ");

    rows.push(
      [
        sale.id,
        sale.createdAt.toISOString(),
        sale.status,
        sale.paymentMethod,
        sale.subtotal.toFixed(2),
        sale.discountAmount.toFixed(2),
        sale.taxAmount.toFixed(2),
        sale.total.toFixed(2),
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",")
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sales-export-${Date.now()}.csv"`,
    },
  });
}