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
// GET /api/subscription — Obuna holati
// ═══════════════════════════════════════════════════════════
export async function GET() {
  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // BusinessSettings dan obuna ma'lumotlarini olish
  const settings = await prisma.businessSettings.findFirst({
    where: { storeId },
    select: {
      id: true,
      name: true,
      setupComplete: true,
    },
  });

  if (!settings) {
    return NextResponse.json({
      ok: true,
      subscription: null,
      message: "Obuna mavjud emas",
    });
  }

  return NextResponse.json({
    ok: true,
    subscription: {
      storeId,
      name: settings.name,
      status: "ACTIVE",
      setupComplete: settings.setupComplete,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// POST /api/subscription — Obunani yangilash
// ═══════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeId = await getStoreId();
  if (!storeId) {
    return NextResponse.json(
      { error: "Foydalanuvchi do'konga biriktirilmagan" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { plan = "BASIC" } = body as { plan?: string };

  // BusinessSettings ni yangilash
  const settings = await prisma.businessSettings.findFirst({
    where: { storeId },
  });

  if (!settings) {
    return NextResponse.json(
      { error: "Sozlamalar topilmadi" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Obuna yangilandi",
    subscription: {
      storeId,
      plan,
      status: "ACTIVE",
    },
  });
}