import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { ProductTable } from "@/components/products/product-table";
import { DbError } from "@/components/ui/db-error";
import { getTranslations } from "next-intl/server";
import { getCurrentSubscriptionLimit } from "@/lib/subscription-guard";
import { AlertCircle } from "lucide-react";
import type { Product } from "@/generated/prisma/client"; 

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  noStore();
  const t = await getTranslations("products");

  let products: Product[] = [];
  let limitError: string | null = null;

  try {
    const raw = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    products = serialize(raw) as Product[];

    const limit = await getCurrentSubscriptionLimit("products");
    if (limit !== null && products.length >= limit) {
      limitError = t("limit_reached", { limit });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("faol emas")) {
      limitError = error.message;
    } else {
      return <DbError page="products" />;
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        
        {limitError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{limitError}</span>
            <Link href="/subscription" className="underline font-bold ml-2 whitespace-nowrap">
              Obunani yangilash
            </Link>
          </div>
        ) : (
          <Link
            href="/products/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
          >
            + {t("add")}
          </Link>
        )}
      </div>
      
      <ProductTable products={products} />
    </div>
  );
}