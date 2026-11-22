"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Crown, Zap, Rocket, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isPopular: boolean;
}

interface CurrentSubscription {
  planId: string;
  planSlug: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string;
}

interface SubscriptionClientProps {
  plans: Plan[];
  currentSubscription: CurrentSubscription | null;
}

const planIcons: Record<string, React.ReactNode> = {
  start: <Rocket className="h-5 w-5" />,
  standard: <Zap className="h-5 w-5" />,
  premium: <Crown className="h-5 w-5" />,
};

export default function SubscriptionClient({ plans, currentSubscription }: SubscriptionClientProps) {
  const t = useTranslations("subscription");
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

 const handleChoosePlan = async (plan: Plan) => {
  setLoadingPlan(plan.id);
  try {
    const amount = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

    const res = await fetch("/api/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, billingCycle, amount }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: To'lov yaratishda xatolik`);
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      router.push(`/subscription/checkout?plan=${plan.id}&cycle=${billingCycle}`);
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert(error instanceof Error ? error.message : "Noma'lum xatolik");
  } finally {
    setLoadingPlan(null);
  }
};
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {currentSubscription && (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4 text-center">
            <p className="text-sm text-green-800 dark:text-green-300">
              {t("current_subscription", {
                plan: currentSubscription.planSlug,
                date: new Date(currentSubscription.currentPeriodEnd).toLocaleDateString(),
              })}
            </p>
          </div>
        )}

        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="inline-flex rounded-lg border p-1 bg-muted w-full sm:w-auto max-w-xs sm:max-w-none">
            <button
              onClick={() => setBillingCycle("monthly")}
              disabled={!!loadingPlan}
              className={`flex-1 cursor-pointer sm:flex-none px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                billingCycle === "monthly" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              {t("billing.monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              disabled={!!loadingPlan}
              className={`flex-1 cursor-pointer sm:flex-none px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                billingCycle === "yearly" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              {t("billing.yearly")}
              <span className="ml-1 text-[10px] sm:text-xs text-green-600 font-bold">-10%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const period = billingCycle === "monthly" ? t("period.month") : t("period.year");
            const isCurrent = currentSubscription?.planId === plan.id;
            const icon = planIcons[plan.slug] || <Rocket className="h-5 w-5" />;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 sm:p-6 flex flex-col transition-shadow hover:shadow-md ${
                  plan.isPopular ? "border-primary shadow-lg" : "border-border"
                } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                {plan.isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] sm:text-xs font-semibold text-primary-foreground whitespace-nowrap">
                    {t("popular")}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap">
                    {t("current_plan")}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  {icon}
                  <h2 className="text-lg sm:text-xl font-bold">{plan.name}</h2>
                </div>

                <div className="mb-4">
                  <span className="text-2xl sm:text-3xl font-bold">
                    {price.toLocaleString()} so'm
                  </span>
                  <span className="text-muted-foreground text-xs sm:text-sm ml-1">
                    / {period}
                  </span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoosePlan(plan)}
                  disabled={isCurrent || !!loadingPlan}
                  className={`w-full cursor-pointer rounded-md py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-green-600 text-white cursor-default"
                      : plan.isPopular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border hover:bg-accent"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent
                    ? t("current_plan")
                    : loadingPlan === plan.id
                    ? t("processing")
                    : t("choose_plan")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}