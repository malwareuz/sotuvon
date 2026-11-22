import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    // 1. Tranzaksiyani topish
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. Metadata ni xavfsiz o'qish
    const meta = tx.metadata as { planId?: string; billingCycle?: string } | null;
    if (!meta || !meta.planId || !meta.billingCycle) {
      return NextResponse.json({ error: "Invalid transaction metadata" }, { status: 400 });
    }

    // 3. Sana hisoblash
    const now = new Date();
    const end = new Date(now);
    
    // billingCycle "monthly" yoki "MONTHLY" bo'lishi mumkin
    const isMonthly = meta.billingCycle === "MONTHLY" || meta.billingCycle === "monthly";
    
    if (isMonthly) {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    // 4. Obunani yaratish yoki yangilash (Upsert)
    const subscription = await prisma.subscription.upsert({
      where: { userId: tx.userId },
      create: {
        userId: tx.userId,
        planId: meta.planId,
        status: "ACTIVE",
        billingCycle: isMonthly ? "MONTHLY" : "YEARLY", // Enum qiymati
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
      update: {
        planId: meta.planId,
        status: "ACTIVE",
        billingCycle: isMonthly ? "MONTHLY" : "YEARLY",
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
    });

    // 5. Tranzaksiyani SUCCESS qilish
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: "SUCCESS",
        subscriptionId: subscription.id, // Obuna ID sini bog'lash
      },
    });

    // 6. Foydalanuvchi statusini yangilash
    await prisma.user.update({
      where: { id: tx.userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: end,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Confirm subscription error:", error); // Terminalda aniq xatoni ko'rsatadi
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}