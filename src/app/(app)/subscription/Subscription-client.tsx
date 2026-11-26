
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Zap,
  Rocket,
  Loader2,
} from "lucide-react";

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

export default function SubscriptionClient({
  plans,
  currentSubscription,
}: SubscriptionClientProps) {
  const t = useTranslations("subscription");
  const router = useRouter();

  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "yearly"
  >("monthly");

  const [loadingPlan, setLoadingPlan] = useState<string | null>(
    null
  );

  // Hozirgi tarifni aniqlash
  const isCurrentPlan = (plan: Plan) => {
    if (!currentSubscription) return false;

    return (
      currentSubscription.planId === plan.id ||
      currentSubscription.planSlug === plan.slug
    );
  };

  // Tarif tanlash va to'lovga o'tish
  const handleChoosePlan = async (plan: Plan) => {
    if (isCurrentPlan(plan) || loadingPlan) return;

    setLoadingPlan(plan.id);

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingCycle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            `HTTP ${res.status}: To'lov yaratishda xatolik`
        );
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(
          `/subscription/checkout?plan=${encodeURIComponent(
            plan.id
          )}&cycle=${billingCycle}`
        );
      }
    } catch (error) {
      console.error("Checkout error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Noma'lum xatolik"
      );

      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Sarlavha */}
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
            {t("title")}
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* Joriy obuna */}
        {currentSubscription && (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
            <p className="text-sm text-green-800 dark:text-green-300">
              {t("current_subscription", {
                plan: currentSubscription.planSlug,
                date: new Date(
                  currentSubscription.currentPeriodEnd
                ).toLocaleDateString(),
              })}
            </p>
          </div>
        )}

        {/* Oylik / Yillik */}
        <div className="mb-8 flex justify-center sm:mb-12">
          <div className="inline-flex w-full max-w-xs rounded-lg border bg-muted p-1 sm:w-auto sm:max-w-none">

            <button
              onClick={() => setBillingCycle("monthly")}
              disabled={!!loadingPlan}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 sm:flex-none sm:px-6 sm:text-sm ${
                billingCycle === "monthly"
                  ? "bg-background shadow"
                  : "text-muted-foreground"
              }`}
            >
              {t("billing.monthly")}
            </button>

            <button
              onClick={() => setBillingCycle("yearly")}
              disabled={!!loadingPlan}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 sm:flex-none sm:px-6 sm:text-sm ${
                billingCycle === "yearly"
                  ? "bg-background shadow"
                  : "text-muted-foreground"
              }`}
            >
              {t("billing.yearly")}

              <span className="ml-1 text-[10px] font-bold text-green-600 sm:text-xs">
                -10%
              </span>
            </button>

          </div>
        </div>

        {/* Tariflar */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">

          {plans.map((plan) => {
            const price =
              billingCycle === "monthly"
                ? plan.priceMonthly
                : plan.priceYearly;

            const period =
              billingCycle === "monthly"
                ? t("period.month")
                : t("period.year");

            const isCurrent = isCurrentPlan(plan);

            const isLoading = loadingPlan === plan.id;

            const icon =
              planIcons[plan.slug] || (
                <Rocket className="h-5 w-5" />
              );

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-4 transition-all sm:p-6 ${
                  isCurrent
                    ? "border-green-500 bg-green-50/50 ring-2 ring-green-500 dark:bg-green-950/20"
                    : plan.isPopular
                    ? "border-primary shadow-lg"
                    : "border-border"
                }`}
              >

                {/* Mashhur tarif */}
                {plan.isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground sm:text-xs">
                    {t("popular")}
                  </div>
                )}

                {/* Joriy tarif belgisi */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-600 px-3 py-1 text-[10px] font-semibold text-white sm:text-xs">
                    ✓ JORIY TARIF
                  </div>
                )}

                {/* Tarif nomi */}
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  {icon}

                  <h2 className="text-lg font-bold sm:text-xl">
                    {plan.name}
                  </h2>
                </div>

                {/* Narxi */}
                <div className="mb-4">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm
                  </span>

                  <span className="ml-1 text-xs text-muted-foreground sm:text-sm">
                    / {period}
                  </span>
                </div>

                {/* Imkoniyatlar */}
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Tarif tugmasi */}
                <button
                  onClick={() => handleChoosePlan(plan)}
                  disabled={isCurrent || !!loadingPlan}
                  className={`flex w-full items-center justify-center cursor-pointer gap-2 rounded-md py-2 text-xs font-medium transition-all sm:text-sm ${
                    isCurrent
                      ? "cursor-not-allowed bg-green-600 text-white opacity-100"
                      : plan.isPopular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border hover:bg-accent"
                  } ${
                    !isCurrent && loadingPlan
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >

                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {isCurrent
                    ? "Joriy tarif"
                    : isLoading
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
