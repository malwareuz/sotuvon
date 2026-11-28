import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache"; // ⬅️ Keshni o'chirish uchun
import SubscriptionClient from "./Subscription-client";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export default async function SubscriptionPage() {
  noStore(); // ⬅️ QO'SHILDI: Har safar yangi ma'lumot olish (keshni o'chirish)

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const serializedPlans = SUBSCRIPTION_PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    features: [...p.features],
    isPopular: p.isPopular,
  }));

  // ⬇️ Bazada `findUnique` o'rniga `findFirst` ishlatish xavfsizroq
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc", // eng so'nggi obunani olish (agar maydon bo'lsa)
    },
  });

  // ⬇️ Obuna faolligini va muddatini tekshirish
  let currentSubscription = null;

  if (subscription) {
    const isExpired = new Date() > subscription.currentPeriodEnd;
    const isActive = subscription.status === "ACTIVE" && !isExpired;

    // Agar obuna faol bo'lsa yoki faqat ma'lumotni ko'rsatmoqchi bo'lsak
    currentSubscription = {
      planId: subscription.planId,
      planSlug: subscription.plan.slug,
      // Statusni UI'ga to'g'ri uzatish
      status: isActive ? "ACTIVE" : "EXPIRED", 
      billingCycle: subscription.billingCycle,
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    };
  }

  return (
    <SubscriptionClient
      plans={serializedPlans}
      currentSubscription={currentSubscription}
    />
  );
}