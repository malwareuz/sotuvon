import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, billingCycle, amount } = await req.json();

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      amount,
      currency: "UZS",
      provider: "PAYME",
      status: "PENDING",
      metadata: { planId, billingCycle },
    },
  });

  const amountInTiyin = amount * 100;
  const paymeMerchantId = process.env.PAYME_MERCHANT_ID;
  
  // ✅ base64 formatida URL yaratish
  const params = `m=${paymeMerchantId};ac.order_id=${transaction.id};a=${amountInTiyin}`;
  const base64Params = Buffer.from(params).toString('base64');
  const checkoutUrl = `https://checkout.paycom.uz/${base64Params}`;

  return NextResponse.json({ ok: true, transactionId: transaction.id, checkoutUrl });
}