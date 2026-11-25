// src/app/api/subscription/checkout/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, billingCycle, amount } = await req.json();

  // 1. Transaction yaratish (PENDING holatida)
  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      amount,
      currency: "UZS",
      provider: "MANUAL", // ✅ Test rejimi uchun
      status: "PENDING",
      metadata: { planId, billingCycle },
    },
  });

  // 2. To'g'ridan-to'g'ri o'zimizning to'lov sahifamizga yuboramiz
  const checkoutUrl = `/subscription/checkout?tx=${transaction.id}`;

  return NextResponse.json({ ok: true, transactionId: transaction.id, checkoutUrl });
}