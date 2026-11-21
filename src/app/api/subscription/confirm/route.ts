import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    if (!transactionId) return NextResponse.json({ error: "Missing tx" }, { status: 400 });

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const meta = tx.metadata as { planId: string; billingCycle: "MONTHLY" | "YEARLY" };
    const now = new Date();
    const end = new Date(now);
    if (meta.billingCycle === "MONTHLY") end.setMonth(end.getMonth() + 1);
    else end.setFullYear(end.getFullYear() + 1);

    // Subscription yaratish yoki yangilash
    const sub = await prisma.subscription.upsert({
      where: { userId: tx.userId },
      create: {
        userId: tx.userId,
        planId: meta.planId,
        status: "ACTIVE",
        billingCycle: meta.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
      update: {
        planId: meta.planId,
        status: "ACTIVE",
        billingCycle: meta.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
    });

    // Transaction ni SUCCESS qilish
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "SUCCESS", subscriptionId: sub.id },
    });

    // User statusini yangilash
    await prisma.user.update({
      where: { id: tx.userId },
      data: { subscriptionStatus: "ACTIVE", subscriptionEndsAt: end },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}