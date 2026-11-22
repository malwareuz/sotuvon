import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UsersClient } from "@/components/settings/users-client";
import { getCurrentSubscriptionLimit } from "@/lib/subscription-guard";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  noStore();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/pos");
  }

  // 1. Barcha foydalanuvchilarni olish
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Joriy obuna limitini tekshirish (kassalar uchun)
  let limitError = null;
  try {
    const maxUsers = await getCurrentSubscriptionLimit("registers");
    
    // Faqat ADMIN bo'lmagan (ya'ni CASHIER) larni hisoblaymiz
    const cashierCount = users.filter(u => u.role === "CASHIER").length;

    if (maxUsers !== null && cashierCount >= maxUsers) {
      limitError = `Sizning obunangizda ${maxUsers} ta kassa (xodim) qo'shish limiti tugadi. Iltimos, obunani yangilang.`;
    }
  } catch (error: any) {
    if (error.message.includes("faol emas")) {
      limitError = error.message;
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage system users</p>
        </div>

        {/* Obuna limiti tugagan bo'lsa, ogohlantirish */}
        {limitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{limitError}</span>
            <Link href="/subscription" className="underline font-bold ml-2 whitespace-nowrap">
              Obunani yangilash
            </Link>
          </div>
        )}
      </div>

      {/* 
        MUHIM: UsersClient komponentiga `disabled={!!limitError}` propini yuborish kerak.
        Shunda limit tugagan bo'lsa, "Yangi foydalanuvchi qo'shish" tugmasi bloklanadi.
      */}
      <UsersClient initialUsers={users} limitReached={!!limitError} />
    </div>
  );
}