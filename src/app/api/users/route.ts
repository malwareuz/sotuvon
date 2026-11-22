import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkSubscriptionLimit } from "@/lib/subscription-guard";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true, emailVerified: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // ✅ Obuna limitini tekshirish
    await checkSubscriptionLimit(session.user.id, "registers");

    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Barcha maydonlarni to'ldiring" }, { status: 400 });
    }

    // Parolni hash qilish (Better Auth formatida)
    const saltBytes = crypto.randomBytes(16);
    const saltHex = saltBytes.toString("hex");
    const keyBuf = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password.normalize("NFKC"), saltHex, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }, (err, derived) => {
        if (err) reject(err); else resolve(derived);
      });
    });
    const hashedPassword = `${saltHex}:${keyBuf.toString("hex")}`;
    const userId = crypto.randomBytes(12).toString("hex");

    const user = await prisma.user.create({
      data: { id: userId, email, name, emailVerified: true, role: role || "CASHIER" },
    });

    await prisma.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password: hashedPassword },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 403 } // Xato bo'lsa 403 qaytaradi va frontendda toast chiqadi
    );
  }
}