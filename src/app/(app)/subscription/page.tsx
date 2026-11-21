import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionClient from "./Subscription-client";

export default async function SubscriptionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("PLANS FROM DB:", plans);

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  const serializedPlans = plans.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceMonthly: Number(p.priceMonthly),
    priceYearly: Number(p.priceYearly),
    features: p.features as string[],
    isPopular: p.isPopular,
  }));

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
              currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            }
          : null
      }
    />
  );
}