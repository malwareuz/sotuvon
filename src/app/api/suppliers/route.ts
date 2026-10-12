import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1),
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
// GET /api/suppliers — Yetkazib beruvchilar ro'yxati
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

  const q = req.nextUrl.searchParams.get("q") ?? "";

  // ⚠️ FAQAT SHU DO'KON
  const suppliers = await prisma.supplier.findMany({
    where: {
      storeId,
      ...(q
        ? { name: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ suppliers });
}

// ═══════════════════════════════════════════════════════════
// POST /api/suppliers — Yangi yetkazib beruvchi
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
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supplier = await prisma.supplier.create({
    data: {
      ...parsed.data,
      storeId,  // ← STORE ID QO'SHILDI
    },
  });

  return NextResponse.json({ supplier }, { status: 201 });
}