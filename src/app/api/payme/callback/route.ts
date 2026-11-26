import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Payme JSON-RPC metodlari
export async function POST(req: Request) {
  const body = await req.json();
  const { method, params } = body;

  // 1. Autentifikatsiyani tekshirish (Basic Auth)
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Basic ${Buffer.from(`Paycom:${process.env.PAYME_KEY}`).toString("base64")}`;
  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: { code: -32504, message: "Auth failed" } });
  }

  try {
    switch (method) {
      case "CheckPerformTransaction": {
        const { account } = params;
        const tx = await prisma.transaction.findUnique({ where: { id: account.order_id } });
        if (!tx || tx.status !== "PENDING") {
          return NextResponse.json({ error: { code: -31050, message: "Order not found" } });
        }
        // Summani tekshirish (tiyinda)
        if (Number(tx.amount) * 100 !== params.amount) {
          return NextResponse.json({ error: { code: -31001, message: "Wrong amount" } });
        }
        return NextResponse.json({ result: { allow: true } });
      }

      case "CreateTransaction": {
        // Payme tranzaksiyani "bloklaydi" (PREPARED holatiga o'tkazadi)
        const { account, id: paymeTxId } = params;
        await prisma.transaction.update({
          where: { id: account.order_id },
          data: { 
            status: "PREPARED",
            metadata: { ...(await prisma.transaction.findUnique({where:{id:account.order_id}}))?.metadata as any, paymeTxId }
          },
        });
        return NextResponse.json({ result: { create_time: Date.now(), transaction: paymeTxId, state: 1 } });
      }

      case "PerformTransaction": {
        const { id: paymeTxId } = params;
        const tx = await prisma.transaction.findFirst({ where: { metadata: { path: ["paymeTxId"], equals: paymeTxId } } });
        if (!tx) return NextResponse.json({ error: { code: -31003, message: "Transaction not found" } });

        await confirmSubscription(tx);

        await prisma.transaction.update({ where: { id: tx.id }, data: { status: "SUCCESS" } });
        return NextResponse.json({ result: { transaction: paymeTxId, perform_time: Date.now(), state: 2 } });
      }

      case "CancelTransaction": {
        // To'lov bekor qilindi
        const { id: paymeTxId, reason } = params;
        const tx = await prisma.transaction.findFirst({ where: { metadata: { path: ["paymeTxId"], equals: paymeTxId } } });
        if (tx) {
          await prisma.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
        }
        return NextResponse.json({ result: { transaction: paymeTxId, cancel_time: Date.now(), state: -2 } });
      }

      default:
        return NextResponse.json({ error: { code: -32601, message: "Method not found" } });
    }
  } catch (error) {
    console.error("Payme callback error:", error);
    return NextResponse.json({ error: { code: -32400, message: "Internal error" } });
  }
}

// Sizning mavjud confirm logikangiz
async function confirmSubscription(tx: any) {
  const meta = tx.metadata as { planId: string; billingCycle: "MONTHLY" | "YEARLY" };
  const now = new Date();
  const end = new Date(now);
  if (meta.billingCycle === "MONTHLY") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { userId: tx.userId },
    create: { userId: tx.userId, planId: meta.planId, status: "ACTIVE", billingCycle: meta.billingCycle, currentPeriodStart: now, currentPeriodEnd: end },
    update: { planId: meta.planId, status: "ACTIVE", billingCycle: meta.billingCycle, currentPeriodStart: now, currentPeriodEnd: end },
  });

  await prisma.user.update({ where: { id: tx.userId }, data: { subscriptionStatus: "ACTIVE", subscriptionEndsAt: end } });
}