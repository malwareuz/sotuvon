
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionClient from "./Subscription-client";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export default async function SubscriptionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Tariflarni koddan olish
  const serializedPlans = SUBSCRIPTION_PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    features: [...p.features],
    isPopular: p.isPopular,
  }));

  // Foydalanuvchining obunasini bazadan olish
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      plan: true,
    },
  });

  return (
    <SubscriptionClient
      plans={serializedPlans}
      currentSubscription={
        subscription
          ? {
              planId: subscription.planId,
              planSlug: subscription.plan.slug,
              status: subscription.status,
              billingCycle: subscription.billingCycle,
              currentPeriodEnd:
                subscription.currentPeriodEnd.toISOString(),
            }
          : null
      }
    />
  );
}
