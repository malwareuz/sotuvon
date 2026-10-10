"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { changePasswordAction } from "@/app/actions/user-actions";

interface ChangePasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordForm({
  open,
  onOpenChange,
}: ChangePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!formData.currentPassword) newErrors.currentPassword = "Joriy parol talab qilinadi";
    if (!formData.newPassword) newErrors.newPassword = "Yangi parol talab qilinadi";
    if (formData.newPassword.length < 6) newErrors.newPassword = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Parolni tasdiqlash talab qilinadi";
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Parollar mos kelmayapti";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePasswordAction({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result.error) {
        if ("details" in result && result.details) {
          // Zod validation errors
          const fieldErrors: Record<string, string> = {};
          result.details.forEach((err) => {
            const key = err.path[0] !== undefined ? String(err.path[0]) : "global";
            fieldErrors[key] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          toast.error(result.error as string);
        }
        setIsLoading(false);
        return;
      }

      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Parolni o'zgartirib bo'lmadi"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Parolni o'zgartirish</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PasswordInput
            label="Current Password"
            value={formData.currentPassword}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            placeholder="Joriy parolingizni kiriting"
            error={errors.currentPassword}
          />

          <PasswordInput
            label="New Password"
            value={formData.newPassword}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            placeholder="Yangi parolni kiriting"
            error={errors.newPassword}
          />

          <PasswordInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Confirm new password"
            error={errors.confirmPassword}
          />

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors text-sm font-medium"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium inline-flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "O'zgarish..." : "Parolni o'zgartirish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
