import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, billingCycle, amount } = await req.json();
    if (!planId || !billingCycle || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Transaction yaratish
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        currency: "UZS",
        provider: "MANUAL",
        status: "PENDING",
        metadata: { planId, billingCycle },
      },
    });

    // ⚠️ MOCK: Payme/Click/Stripe bilan almashtiring
    const checkoutUrl = `/subscription/checkout?tx=${transaction.id}`;

    return NextResponse.json({ ok: true, transactionId: transaction.id, checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}