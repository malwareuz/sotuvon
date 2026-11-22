import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// 1. Limitni tekshirish va xato tashlash (POST so'rovlar uchun)
export async function checkSubscriptionLimit(
  userId: string,
  feature: "registers" | "products"
) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (
    !subscription ||
    subscription.status !== "ACTIVE" ||
    new Date() > subscription.currentPeriodEnd
  ) {
    throw new Error("Sizning obunangiz faol emas. Iltimos, obunani yangilang.");
  }

  const planSlug = subscription.plan.slug;

  if (feature === "registers") {
    // Faqat CASHIER larni hisoblaymiz (Adminlarni emas)
    const registerCount = await prisma.user.count({ where: { role: "CASHIER" } });
    if (planSlug === "start" && registerCount >= 1) {
      throw new Error("Start rejasida faqat 1 ta kassa (xodim) ishlatish mumkin. Obunani yangilang.");
    }
    if (planSlug === "standard" && registerCount >= 3) {
      throw new Error("Standard rejasida faqat 3 tagacha kassa ishlatish mumkin. Premium ga o'ting.");
    }
  }

  if (feature === "products") {
    const productCount = await prisma.product.count();
    if (planSlug === "start" && productCount >= 500) {
      throw new Error("Start rejasida 500 tagacha mahsulot qo'shish mumkin. Obunani yangilang.");
    }
  }

  return true;
}

// 2. Joriy limitni olish (Frontendda ko'rsatish uchun)
export async function getCurrentSubscriptionLimit(
  feature: "registers" | "products"
): Promise<number | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  if (
    !subscription ||
    subscription.status !== "ACTIVE" ||
    new Date() > subscription.currentPeriodEnd
  ) {
    throw new Error("Sizning obunangiz faol emas. Iltimos, obunani yangilang.");
  }

  const planSlug = subscription.plan.slug;

  if (feature === "products") {
    if (planSlug === "start") return 500;
    return null;
  }

  if (feature === "registers") {
    if (planSlug === "start") return 1;
    if (planSlug === "standard") return 3;
    return null;
  }

  return null;
}