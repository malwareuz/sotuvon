import type { Metadata } from "next";
import { ProductForm } from "@/components/products/product-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useTranslations } from "next-intl";
export const metadata: Metadata = { title: "New Product" };

export default function NewProductPage() {
  const t = useTranslations("pform");
  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Breadcrumb items={[
        { label: "Products", href: "/products" },
        { label: "Add Product" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">{t("proaddddd")}</h1>
      <ProductForm />
    </div>
  );
}
