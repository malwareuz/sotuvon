"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { productFormSchema } from "@/lib/validations/product";

function isConstraintOn(e: any, field: string): boolean {
  const constraint: string = e.meta?.constraint ?? "";
  const target: unknown = e.meta?.target;
  const fieldLower = field.toLowerCase();

  if (constraint && constraint.toLowerCase().includes(fieldLower)) return true;
  if (Array.isArray(target)) return target.some((t: string) => t.toLowerCase().includes(fieldLower));
  if (typeof target === "string") return target.toLowerCase().includes(fieldLower);
  return false;
}

// ═══════════════════════════════════════════════════════════
// STORE'NI OLISH
// ═══════════════════════════════════════════════════════════
async function getCurrentStore() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    throw new Error("Avtorizatsiya talab qilinadi");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeId: true },
  });

  if (!user?.storeId) {
    throw new Error("Foydalanuvchi do'konga biriktirilmagan");
  }

  return user.storeId;
}

// ═══════════════════════════════════════════════════════════
// CREATE PRODUCT
// ═══════════════════════════════════════════════════════════
export async function createProduct(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  let storeId: string;
  try {
    storeId = await getCurrentStore();
  } catch (err) {
    return { error: { formErrors: [(err as Error).message], fieldErrors: {} } };
  }

  const data = {
    ...parsed.data,
    sku: parsed.data.sku || null,
    barcode: parsed.data.barcode || null,
    category: parsed.data.category || null,
    imageUrl: parsed.data.imageUrl || null,
    storeId,  // ← STORE ID QO'SHILDI
  };

  try {
    await prisma.product.create({ data });
  } catch (e: any) {
    console.error("createProduct error:", e.code, JSON.stringify(e.meta));
    if (e.code === "P2002") {
      if (isConstraintOn(e, "sku")) {
        return { error: { formErrors: [], fieldErrors: { sku: ["A product with this SKU already exists"] } } };
      }
      if (isConstraintOn(e, "barcode")) {
        return { error: { formErrors: [], fieldErrors: { barcode: ["A product with this Barcode already exists"] } } };
      }
      return { error: { formErrors: ["A duplicate value was found. Please check SKU or barcode."], fieldErrors: {} } };
    }
    return { error: { formErrors: ["An unexpected error occurred. Please try again."], fieldErrors: {} } };
  }

  revalidatePath("/products");
  redirect("/products");
}

// ═══════════════════════════════════════════════════════════
// UPDATE PRODUCT
// ═══════════════════════════════════════════════════════════
export async function updateProduct(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const data = {
    ...parsed.data,
    sku: parsed.data.sku || null,
    barcode: parsed.data.barcode || null,
    category: parsed.data.category || null,
    imageUrl: parsed.data.imageUrl || null,
  };

  try {
    await prisma.product.update({ where: { id }, data });
  } catch (e: any) {
    console.error("updateProduct error:", e.code, JSON.stringify(e.meta));
    if (e.code === "P2002") {
      if (isConstraintOn(e, "sku")) {
        return { error: { formErrors: [], fieldErrors: { sku: ["A product with this SKU already exists"] } } };
      }
      if (isConstraintOn(e, "barcode")) {
        return { error: { formErrors: [], fieldErrors: { barcode: ["A product with this Barcode already exists"] } } };
      }
      return { error: { formErrors: ["A duplicate value was found. Please check SKU or barcode."], fieldErrors: {} } };
    }
    return { error: { formErrors: ["An unexpected error occurred. Please try again."], fieldErrors: {} } };
  }

  revalidatePath("/products");
  redirect("/products");
}

// ═══════════════════════════════════════════════════════════
// DELETE PRODUCT
// ═══════════════════════════════════════════════════════════
export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
}