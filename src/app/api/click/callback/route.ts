import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// ✅ confirmSubscription funksiyasi shu yerda e'lon qilinadi
async function confirmSubscription(tx: {
  id: string;
  userId: string;
  metadata: unknown;
}) {
  const meta = tx.metadata as { planId: string; billingCycle: "MONTHLY" | "YEARLY" };
  const now = new Date();
  const end = new Date(now);
  if (meta.billingCycle === "MONTHLY") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);

  await prisma.subscription.upsert({
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

  await prisma.user.update({
    where: { id: tx.userId },
    data: { subscriptionStatus: "ACTIVE", subscriptionEndsAt: end },
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const data: Record<string, string> = {};

  // ✅ FormDataEntryValue ni string ga aylantirish
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      data[key] = value;
    }
  });

  const {
    click_trans_id,
    service_id,
    merchant_trans_id,
    amount,
    action,
    error,
    sign_time,
    sign_string,
    merchant_prepare_id,
  } = data;

  // 1. Imzoni tekshirish
  const secretKey = process.env.CLICK_SECRET_KEY ?? "";
  let signString = "";
  if (action === "0") {
    signString = crypto
      .createHash("md5")
      .update(
        `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`
      )
      .digest("hex");
  } else {
    signString = crypto
      .createHash("md5")
      .update(
        `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`
      )
      .digest("hex");
  }

  if (signString !== sign_string) {
    return NextResponse.json({ error: -1, error_note: "Sign check failed" });
  }

  // 2. Tranzaksiyani topish
  const tx = await prisma.transaction.findUnique({ where: { id: merchant_trans_id } });
  if (!tx) return NextResponse.json({ error: -5, error_note: "Order not found" });

  if (action === "0") {
    // PREPARE
    if (Number(tx.amount) !== Number(amount)) {
      return NextResponse.json({ error: -2, error_note: "Wrong amount" });
    }
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "PREPARED" }, // ✅ Endi PREPARED enumda bor
    });
    return NextResponse.json({
      error: 0,
      error_note: "Success",
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: tx.id,
    });
  } else {
    // COMPLETE
    if (error === "0") {
      await confirmSubscription(tx);
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "SUCCESS" },
      });
      return NextResponse.json({
        error: 0,
        error_note: "Success",
        click_trans_id,
        merchant_trans_id,
      });
    } else {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ error: -9, error_note: "Cancelled" });
    }
  }
}