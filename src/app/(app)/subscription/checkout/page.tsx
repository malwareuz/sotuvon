"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function CheckoutPage() {
  const t = useTranslations("subscription");
  const params = useSearchParams();
  const router = useRouter();
  const txId = params.get("tx");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    if (!txId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "To'lov tasdiqlanmadi");
      }

      setSuccess(true);
      setTimeout(() => router.push("/subscription"), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (!txId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Transaction topilmadi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-xl border p-6 text-center space-y-4">
        {success ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h1 className="text-xl font-bold">{t("payment_success")}</h1>
            <p className="text-sm text-muted-foreground">{t("redirecting")}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">{t("checkout_title")}</h1>
            <p className="text-sm text-muted-foreground">{t("checkout_desc")}</p>
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("pay_now")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}