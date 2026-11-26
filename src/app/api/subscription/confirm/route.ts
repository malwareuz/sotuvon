
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

    const { transactionId } = await req.json();

    if (!transactionId || typeof transactionId !== "string") {
      return NextResponse.json(
        { error: "Transaction ID mavjud emas" },
        { status: 400 }
      );
    }

    const tx = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.user.id,
      },
    });

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction topilmadi" },
        { status: 404 }
      );
    }

    // Qayta tasdiqlashga yo'l qo'ymaymiz
    if (tx.status === "SUCCESS") {
      return NextResponse.json({
        ok: true,
        message: "Obuna avval faollashtirilgan",
      });
    }

    if (tx.status !== "PENDING" || tx.provider !== "MANUAL") {
      return NextResponse.json(
        { error: "Transaction holati noto'g'ri" },
        { status: 400 }
      );
    }

    const meta = tx.metadata as {
      planSlug?: string;
      billingCycle?: string;
    } | null;

    if (
      !meta?.planSlug ||
      !["monthly", "yearly"].includes(meta.billingCycle ?? "")
    ) {
      return NextResponse.json(
        { error: "Transaction ma'lumotlari noto'g'ri" },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS.find(
      (p) => p.slug === meta.planSlug
    );

    if (!plan) {
      return NextResponse.json(
        { error: "Tarif topilmadi" },
        { status: 404 }
      );
    }

    const billingCycle = meta.billingCycle;
    const expectedAmount =
      billingCycle === "monthly"
        ? plan.priceMonthly
        : plan.priceYearly;

    if (
      Number(tx.amount) !== expectedAmount ||
      tx.currency !== "UZS"
    ) {
      return NextResponse.json(
        { error: "To'lov summasi noto'g'ri" },
        { status: 400 }
      );
    }

    const now = new Date();
    const end = new Date(now);

    if (billingCycle === "monthly") {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    // Barcha amallar bitta transaction ichida bajariladi
    await prisma.$transaction(async (db) => {
      // Tarifni avtomatik yaratish yoki yangilash
      const dbPlan = await db.subscriptionPlan.upsert({
        where: { slug: plan.slug },
        create: {
          name: plan.name,
          slug: plan.slug,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          features: [...plan.features],
          isPopular: plan.isPopular,
          sortOrder: plan.sortOrder,
          isActive: true,
        },
        update: {
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          features: [...plan.features],
          isPopular: plan.isPopular,
          sortOrder: plan.sortOrder,
          isActive: true,
        },
      });

      // Obunani yaratish yoki yangilash
      const subscription = await db.subscription.upsert({
        where: {
          userId: session.user.id,
        },
        create: {
          userId: session.user.id,
          planId: dbPlan.id,
          status: "ACTIVE",
          billingCycle:
            billingCycle === "monthly" ? "MONTHLY" : "YEARLY",
          currentPeriodStart: now,
          currentPeriodEnd: end,
        },
        update: {
          planId: dbPlan.id,
          status: "ACTIVE",
          billingCycle:
            billingCycle === "monthly" ? "MONTHLY" : "YEARLY",
          currentPeriodStart: now,
          currentPeriodEnd: end,
        },
      });

      // Tranzaksiyani SUCCESS qilish
      await db.transaction.update({
        where: { id: tx.id },
        data: {
          status: "SUCCESS",
          subscriptionId: subscription.id,
        },
      });

      // User statusini yangilash
      await db.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: end,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Obuna muvaffaqiyatli faollashtirildi",
    });
  } catch (error) {
    console.error("Confirm subscription error:", error);

    return NextResponse.json(
      { error: "Obunani faollashtirishda xatolik" },
      { status: 500 }
    );
  }
}
