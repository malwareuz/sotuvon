"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ═══════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "CASHIER"]),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  role: z.enum(["ADMIN", "CASHIER"]).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((pwd) => pwd !== "", "New password is required"),
});

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized: Please log in");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  // ⚠️ STORE'NI OLISH
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeId: true },
  });

  if (!user?.storeId) {
    throw new Error("Foydalanuvchi do'konga biriktirilmagan");
  }

  return { session, storeId: user.storeId };
}

// ═══════════════════════════════════════════════════════════
// CREATE USER
// ═══════════════════════════════════════════════════════════
export async function createUserAction(data: z.infer<typeof createUserSchema>) {
  const { storeId } = await checkAdminAuth();

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = parsed.data;

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "User with this email already exists" };
    }

    // Better Auth orqali user yaratish
    await auth.api.signUpEmail({
      body: { name, email, password },
    });

    // ⚠️ USER'NI YANGILASH: role + storeId
    const user = await prisma.user.update({
      where: { email },
      data: {
        role,
        storeId,  // ← STORE ID QO'SHISH
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath("/settings/users");
    return { success: true, user };
  } catch (err) {
    console.error("Create user error:", err);
    return { error: err instanceof Error ? err.message : "Failed to create user" };
  }
}

// ═══════════════════════════════════════════════════════════
// UPDATE USER
// ═══════════════════════════════════════════════════════════
export async function updateUserAction(id: string, data: z.infer<typeof updateUserSchema>) {
  const { session, storeId } = await checkAdminAuth();

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.issues };
  }

  const updates = parsed.data;

  try {
    // ⚠️ FAQAT SHU DO'KON USERI
    const target = await prisma.user.findFirst({
      where: { id, storeId },  // ← storeId tekshirish
      select: { id: true },
    });

    if (!target) {
      return { error: "User topilmadi" };
    }

    // Prevent self-demotion from admin
    if (updates.role && updates.role !== "ADMIN" && session.user.id === id) {
      return { error: "Cannot demote yourself from admin role" };
    }

    // If changing email, check for duplicates
    if (updates.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updates.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return { error: "Email already in use" };
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.role && { role: updates.role }),
      },
    });

    revalidatePath("/settings/users");
    return { success: true, user };
  } catch (err) {
    console.error("Update user action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update user" };
  }
}

// ═══════════════════════════════════════════════════════════
// DELETE USER
// ═══════════════════════════════════════════════════════════
export async function deleteUserAction(id: string) {
  const { session, storeId } = await checkAdminAuth();

  try {
    // Prevent self-deletion
    if (id === session.user.id) {
      return { error: "Cannot delete your own account" };
    }

    // ⚠️ FAQAT SHU DO'KON USERI
    const targetUser = await prisma.user.findFirst({
      where: { id, storeId },  // ← storeId tekshirish
    });

    if (!targetUser) {
      return { error: "User topilmadi" };
    }

    // Prevent deleting the last admin
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", storeId },  // ← storeId
    });

    if (targetUser.role === "ADMIN" && adminCount === 1) {
      return { error: "Cannot delete the last admin account" };
    }

    // ⚠️ DB Audit Safety — FAQAT SHU DO'KON
    const [salesCount, refundsCount, adjustmentsCount] = await Promise.all([
      prisma.sale.count({ where: { userId: id, storeId } }),              // ← storeId
      prisma.refund.count({ where: { userId: id, storeId } }),            // ← storeId
      prisma.stockAdjustment.count({ where: { userId: id, storeId } }),   // ← storeId
    ]);

    if (salesCount > 0 || refundsCount > 0 || adjustmentsCount > 0) {
      return {
        error: "Cannot delete this user because they have historical sales, refunds, or stock adjustments in the system. You can update their name or change their role instead to preserve audit logs.",
      };
    }

    await prisma.user.delete({ where: { id } });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err) {
    console.error("Delete user action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete user" };
  }
}

// ═══════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════════════════════
export async function updateProfileAction(data: z.infer<typeof updateProfileSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.issues };
  }

  const { name, email } = parsed.data;

  try {
    await auth.api.updateUser({
      body: {
        ...(name && { name }),
        ...(email && { email }),
      },
      headers: await headers(),
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    revalidatePath("/settings/profile");
    revalidatePath("/pos");
    return { success: true, user: updatedUser };
  } catch (err) {
    console.error("Update profile action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update profile" };
  }
}

// ═══════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════
export async function changePasswordAction(data: z.infer<typeof changePasswordSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized: Please log in" };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.issues };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
      headers: await headers(),
    });

    return { success: true, message: "Password changed successfully" };
  } catch (err) {
    console.error("Change password action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to change password" };
  }
}