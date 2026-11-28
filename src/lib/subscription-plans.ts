// export const SUBSCRIPTION_PLANS = [
//   {
//     id: "start",
//     name: "Start",
//     slug: "start",
//     priceMonthly: 149000,
//     priceYearly: 1608000, // 10% chegirma (149000 * 12 * 0.9)
//     features: [
//       
//     ],
//     isPopular: false,
//     sortOrder: 1,
//   },
//   {
//     id: "standard",
//     name: "Standard",
//     slug: "standard",
//     priceMonthly: 249000,
//     priceYearly: 2689200, // 10% chegirma
//     features: [
//       
//     ],
//     isPopular: true,
//     sortOrder: 2,
//   },
//   {
//     id: "premium",
//     name: "Premium",
//     slug: "premium",
//     priceMonthly: 449000,
//     priceYearly: 4849200, // 10% chegirma
//     features: [
//       
      
//     ],
//     isPopular: false,
//     sortOrder: 3,
//   },
// ] as const;
// lib/subscription-plans.ts
export const SUBSCRIPTION_PLANS = [
  {
    id: "start",
    name: "Start",
    slug: "start",
    priceMonthly: 149000,
    priceYearly: 1608000,
    limits: {
      cashiers: 1,
      products: 100,
    },
    features: [ "1 ta kassa",
       "Asosiy hisobotlar",
      "100 tagacha mahsulot",
      "Email qo'llab-quvvatlash",],
    isPopular: false,
    sortOrder: 1,
  },
  {
    id: "standard",
    name: "Standard",
    slug: "standard",
    priceMonthly: 249000,
    priceYearly: 2689200,
    limits: {
      cashiers: 3,
      products: 500,
    },
    features: [ "3 tagacha kassa",
       "Barcha hisobotlar",
       "500 tagacha mahsulot",
       "Telegram qo'llab-quvvatlash",
       "Excel/PDF eksport", ],
    isPopular: true,
    sortOrder: 2,
  },
  {
    id: "premium",
    name: "Premium",
    slug: "premium",
    priceMonthly: 449000,
    priceYearly: 4849200,
    limits: {
      cashiers: 10,
      products: null, // cheksiz
    },
    features: [ "10 tagacha kassa",
       "Ko'p filiallar",
       "Cheksiz mahsulot",
       "Ustuvor qo'llab-quvvatlash",
       "Maxsus hisobotlar",
       "API integratsiya", ],
    isPopular: false,
    sortOrder: 3,
  },
] as const;

export function getPlanBySlug(slug: string) {
  return SUBSCRIPTION_PLANS.find((p) => p.slug === slug);
}

export function getPlanLimit(slug: string, feature: "cashiers" | "products"): number | null {
  const plan = getPlanBySlug(slug);
  return plan?.limits[feature] ?? null;
}