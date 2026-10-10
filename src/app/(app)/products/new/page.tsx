import type { Metadata } from "next";
import { ProductForm } from "@/components/products/product-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Yangi mahsulot" };

export default function NewProductPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Breadcrumb items={[
        { label: "Mahsulotlar", href: "/products" },
        { label: "Mahsulot qo'shish" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">Mahsulot qo'shish</h1>
      <ProductForm />
    </div>
  );
}
