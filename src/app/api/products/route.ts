import { checkSubscriptionLimit } from "@/lib/subscription-guard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // ✅ Mahsulot qo'shishdan oldin limitni tekshirish
    await checkSubscriptionLimit(session.user.id, "products");
    
    // Agar ruxsat berilsa, davom etamiz
    const data = await req.json();
    const product = await prisma.product.create({ data: { ...data } });
    
    return NextResponse.json(product);
  } catch (error: any) {
    // Agar limit tugagan bo'lsa, xatoni qaytaramiz
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}