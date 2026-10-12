import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

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
// PUT /api/customers/[id] — Mijozni yangilash
// ═══════════════════════════════════════════════════════════
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, phone, email, notes } = parsed.data;

    // ⚠️ FAQAT SHU DO'KON MIJOZI
    const existing = await prisma.customer.findFirst({
      where: { id, storeId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Mijoz topilmadi" },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        notes,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════
// DELETE /api/customers/[id] — Mijozni o'chirish
// ═══════════════════════════════════════════════════════════
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    // ⚠️ FAQAT SHU DO'KON MIJOZI
    const existing = await prisma.customer.findFirst({
      where: { id, storeId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Mijoz topilmadi" },
        { status: 404 }
      );
    }

    // Check if customer has sales
    const salesCount = await prisma.sale.count({
      where: { customerId: id, storeId },  // ← storeId
    });

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing sales" },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}