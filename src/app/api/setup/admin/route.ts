import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Guard: only allow if setup not yet complete
  try {
    const { prisma } = await import("@/lib/db");
    const settings = await prisma.businessSettings.findUnique({
      where: { id: "singleton" },
      select: { setupComplete: true },
    });
    if (settings?.setupComplete) {
      return NextResponse.json(
        { error: "Setup already complete" },
        { status: 403 }
      );
    }
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0) {
      return NextResponse.json(
        { error: "An admin account already exists" },
        { status: 409 }
      );
    }
  } catch {
    // DB not ready
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    // ⚠️ STORE'NI TOPISH YOKI YARATISH
    let store = await prisma.store.findFirst();
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: "My Store",
          slug: "default",
        },
      });
    }

    // Better Auth orqali user yaratish (parol hash qilinadi)
    const result = await (auth.api as any).signUpEmail({
      body: {
        name,
        email,
        password,
        // ⚠️ MUHIM: storeId ni signUpEmail ga ham qo'shish
        // Agar Better Auth additional fields ni qo'llab-quvvatlasa
      },
    });

    if (!result) {
      throw new Error("Sign-up returned no result");
    }

    // ⚠️ USER'NI YANGILASH: role + storeId
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        storeId: store.id,  // ← STORE ID BIRIKTIRISH
      },
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    console.error("setup/admin error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create admin";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}