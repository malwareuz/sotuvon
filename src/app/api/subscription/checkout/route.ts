
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { planSlug, billingCycle } = body;

    if (
      typeof planSlug !== "string" ||
      !["monthly", "yearly"].includes(billingCycle)
    ) {
      return NextResponse.json(
        { error: "Noto'g'ri tarif yoki to'lov muddati" },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS.find(
      (p) => p.slug === planSlug
    );

    if (!plan) {
      return NextResponse.json(
        { error: "Tarif topilmadi" },
        { status: 404 }
      );
    }

    const amount =
      billingCycle === "monthly"
        ? plan.priceMonthly
        : plan.priceYearly;

    // Test tranzaksiyasi
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        currency: "UZS",
        provider: "MANUAL",
        status: "PENDING",
        metadata: {
          planSlug: plan.slug,
          billingCycle,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      transactionId: transaction.id,
      checkoutUrl: `/subscription/checkout?tx=${transaction.id}`,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    return NextResponse.json(
      { error: "Checkout yaratishda xatolik" },
      { status: 500 }
    );
  }
}
