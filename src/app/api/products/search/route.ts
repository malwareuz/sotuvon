import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Explicit field allow-list
const PRODUCT_SELECT = {
  id: true,
  name: true,
  price: true,
  stock: true,
  sku: true,
  barcode: true,
  category: true,
  imageUrl: true,
} as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function parseLimit(req: NextRequest): number {
  const raw = Number(req.nextUrl.searchParams.get("limit"));
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
  return Math.min(raw, MAX_LIMIT);
}

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
// GET /api/products/search?q=...&limit=20
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const take = parseLimit(req);

  // ⚠️ FAQAT SHU DO'KON MAHSULOTLARI
  const baseWhere = {
    storeId,
    active: true,
  };

  if (!q.trim()) {
    const products = await prisma.product.findMany({
      where: baseWhere,
      select: PRODUCT_SELECT,
      orderBy: { name: "asc" },
      take,
    });

    return NextResponse.json(
      products.map((p) => ({
        ...p,
        price: parseFloat(p.price.toString()),
      }))
    );
  }

  const products = await prisma.product.findMany({
    where: {
      ...baseWhere,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { equals: q } },
      ],
    },
    select: PRODUCT_SELECT,
    take,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      price: parseFloat(p.price.toString()),
    }))
  );
}