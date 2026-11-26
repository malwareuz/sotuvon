"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { updateSettings } from "@/app/actions/settings-actions";
import { setLocale } from "@/app/actions/locale-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";


const settingsSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  currency: z.string().min(1).max(5),
  currencyDecimals: z.number().int().min(0).max(4),
  taxRate: z.number().min(0).max(100),
  taxName: z.string().min(1),
  receiptFooter: z.string().max(500),
  language: z.string().min(2).max(10),
  // Loyalty
  loyaltyEnabled: z.boolean().optional(),
  loyaltyEarnRate: z.number().min(0),
  loyaltyRedeemValue: z.number().min(1),
  // Inventory
  lowStockThreshold: z.number().int().min(0),
  // Storage
  storageProvider: z.string().default("local"),
  storageRegion: z.string().default(""),
  storageBucket: z.string().default(""),
  storageEndpoint: z.string().default(""),
  storageAccessKey: z.string().default(""),
  storageSecretKey: z.string().default(""),
  storagePublicUrl: z.string().default(""),
});


// Explicitly type the form values to work around Zod v4 + react-hook-form type inference
// (Zod v4 .default() and .optional() produce input types of T | undefined, which
//  react-hook-form's Resolver generic rejects — so we define the shape manually)
type SettingsFormValues = {
  name: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  currency: string;
  currencyDecimals: number;
  taxRate: number;
  taxName: string;
  receiptFooter: string;
  language: string;
  loyaltyEnabled?: boolean;
  loyaltyEarnRate: number;
  loyaltyRedeemValue: number;
  lowStockThreshold: number;
  storageProvider: string;
  storageRegion: string;
  storageBucket: string;
  storageEndpoint: string;
  storageAccessKey: string;
  storageSecretKey: string;
  storagePublicUrl: string;
};

interface Props {
  settings: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
    currency: string;
    currencyDecimals: number;
    taxRate: { toString(): string };
    taxName: string;
    receiptFooter: string;
    language: string;
    loyaltyEnabled: boolean;
    loyaltyEarnRate: { toString(): string };
    loyaltyRedeemValue: { toString(): string };
    lowStockThreshold: number;
    // Storage
    storageProvider: string;
    storageRegion: string | null;
    storageBucket: string | null;
    storageEndpoint: string | null;
    storageAccessKey: string | null;
    hasStorageSecretKey: boolean;
    storagePublicUrl: string | null;
  };
}

export function SettingsForm({ settings }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      name: settings.name,
      logoUrl: settings.logoUrl ?? "",
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
      currency: settings.currency,
      currencyDecimals: settings.currencyDecimals,
      taxRate: parseFloat(settings.taxRate.toString()) * 100,
      taxName: settings.taxName,
      receiptFooter: settings.receiptFooter,
      language: settings.language,
      loyaltyEnabled: settings.loyaltyEnabled,
      loyaltyEarnRate: parseFloat(settings.loyaltyEarnRate.toString()),
      loyaltyRedeemValue: parseFloat(settings.loyaltyRedeemValue.toString()),
      lowStockThreshold: settings.lowStockThreshold,
      // Storage — secret key intentionally never pre-filled (security)
      storageProvider: settings.storageProvider,
      storageRegion: settings.storageRegion ?? "",
      storageBucket: settings.storageBucket ?? "",
      storageEndpoint: settings.storageEndpoint ?? "",
      storageAccessKey: settings.storageAccessKey ?? "",
      storageSecretKey: "",
      storagePublicUrl: settings.storagePublicUrl ?? "",
    },
  });

  const storageProvider = watch("storageProvider");
  const currencySymbol = watch("currency") || settings.currency || "$";
  const t =useTranslations("sett")

  async function onSubmit(values: SettingsFormValues) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v ?? "")));
    fd.set("loyaltyEnabled", values.loyaltyEnabled ? "true" : "false");
    try {
      await updateSettings(fd);
      // Update locale cookie when language changes
      await setLocale(values.language);
      toast.success(`${t("setting")}`);
      router.refresh();
    } catch {
      toast.error(`${t("Failed")}`);
    }
  }

  function field(
    label: string,
    name: keyof SettingsFormValues,
    props?: React.InputHTMLAttributes<HTMLInputElement>
  ) {
    const isNum = props?.type === "number";
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...register(name as any, isNum ? { valueAsNumber: true } : undefined)}
          {...props}
          className={cn(
            "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            errors[name] && "border-destructive"
          )}
        />
        {errors[name] && (
          <p className="text-xs text-destructive">{String(errors[name]?.message)}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Business */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Business</h2>
        {field(`${t("Business_Name")}`, "name", { placeholder: `${t("My_Store")}` })}
        {field(`${t("Logo_URL")}`, "logoUrl", { type: "url", placeholder: "https://…" })}
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">{t("Appearance")}</h2>
        <div className="grid grid-cols-2 gap-4">
          {field(`${t("Primary_Color")}`, "primaryColor", { type: "color" })}
          {field(`${t("Accent_Color")}`, "accentColor", { type: "color" })}
        </div>
      </section>

      {/* Currency & Tax */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">{t("Currency_&_Tax")}</h2>
        <div className="grid grid-cols-2 gap-4">
          {field(`${t("symbol")}`, "currency", { placeholder: "$" })}
          {field(`${t("decimal")}`, "currencyDecimals", { type: "number", min: "0", max: "4" })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field(`${t("rate")}`, "taxRate", { type: "number", step: "0.01", min: "0", max: "100" })}
          {field(`${t("tname")}`, "taxName", { placeholder: "VAT" })}
        </div>
      </section>

      {/* Receipt */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">{t("Receipt")}</h2>
        {field(`${t("ftext")}`, "receiptFooter", { placeholder: `${t("tyou")}` })}
      </section>

      {/* Language */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">{t("Language")}</h2>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("Language")}</label>
          <select
            {...register("language")}
            className="border-input bg-background cursor-pointer ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <option value="en">English</option>
            <option value="uz">Uzbekistan</option>            
                    
            <option value="ru">Русский (Russian)</option>
          </select>
        </div>
      </section>

      {/* Loyalty */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">{t("lprog")}</h2>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">{t("epoin")}</p>
            <p className="text-xs text-muted-foreground">{t("letcust")}</p>
          </div>
          <input
            type="checkbox"
            {...register("loyaltyEnabled")}
            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
         {field(
  t("loyalty_earn_rate", { currency: currencySymbol }),
  "loyaltyEarnRate",
  { type: "number", step: "0.01", min: "0", placeholder: "1" }
)}
{field(
  t("loyalty_redeem_rate", { currency: currencySymbol }),
  "loyaltyRedeemValue",
  { type: "number", step: "1", min: "1", placeholder: "100" }
)} </div>
     <p className="text-xs text-muted-foreground">
  {t("loyalty_example", { currency: currencySymbol })}
</p>
      </section>

      {/* Inventory */}
     <section className="space-y-4">
  <h2 className="text-base font-semibold border-b pb-2">{t("inventory_title")}</h2>
  {field(
    t("low_stock_threshold"),
    "lowStockThreshold",
    { type: "number", min: "0", step: "1", placeholder: "5" }
  )}
  <p className="text-xs text-muted-foreground">{t("low_stock_threshold_desc")}</p>

  {/* Low-stock email alert — placeholder UI, actual emails ship in v0.3 */}
  <div className="rounded-lg border border-dashed p-4 space-y-3 opacity-80">
    <div className="flex items-center gap-2 flex-wrap">
      <h3 className="text-sm font-medium">{t("low_stock_email_alerts")}</h3>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {t("coming_in_v03")}
      </span>
    </div>
    <p className="text-xs text-muted-foreground">
      {t("low_stock_email_desc")}
    </p>
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <input
        type="email"
        disabled
        placeholder="alert@example.com"
        className="flex-1 h-9 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
      />
      <label className="flex items-center gap-2 cursor-not-allowed opacity-60 shrink-0">
        <input type="checkbox" disabled className="accent-primary" />
        <span className="text-sm">{t("enabled")}</span>
      </label>
    </div>
  </div>
</section>

      {/* Image Storage */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">{t("imgstore")}</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("storepro")}</label>
          <select
            {...register("storageProvider")}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <option value="local">{t("localon")}</option>
            <option value="vercel_blob">Vercel Blob</option>
            <option value="cloudflare_r2">Cloudflare R2</option>
            <option value="s3">AWS S3</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {t("proimg")}
          </p>
        </div>

        {storageProvider === "local" && (
  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
    {t.rich("local_warning", {
      code: (chunks) => (
        <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">{chunks}</code>
      ),
      strong: (chunks) => <strong>{chunks}</strong>,
    })}
  </div>
)}
        {storageProvider === "vercel_blob" && (
  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 space-y-2 text-sm">
    <p className="font-medium text-blue-800 dark:text-blue-300">{t("vercel_setup_title")}</p>
    <p className="text-muted-foreground">
      {t.rich("vercel_setup_desc", {
        code: (chunks) => (
          <code className="font-mono bg-muted px-1 rounded">{chunks}</code>
        ),
      })}
    </p>
  </div>
)}

       {(storageProvider === "cloudflare_r2" || storageProvider === "s3") && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {field(t("bucket_name"), "storageBucket", { placeholder: "my-bucket" })}
      {field(
        t("region"),
        "storageRegion",
        { placeholder: storageProvider === "cloudflare_r2" ? "auto" : "us-east-1" }
      )}
    </div>
    {storageProvider === "cloudflare_r2" &&
      field(t("r2_endpoint"), "storageEndpoint", {
        placeholder: "https://<account-id>.r2.cloudflarestorage.com",
      })
    }
    {field(t("access_key_id"), "storageAccessKey", { placeholder: t("access_key_id_placeholder"), autoComplete: "off" })}
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{t("secret_access_key")}</label>
      <input
        {...register("storageSecretKey")}
        type="password"
        autoComplete="new-password"
        placeholder={settings.hasStorageSecretKey ? t("secret_key_placeholder_keep") : t("secret_key_placeholder_new")}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      />
    </div>
    {field(t("public_url_cdn"), "storagePublicUrl", {
      placeholder: storageProvider === "cloudflare_r2"
        ? "https://pub-xxx.r2.dev"
        : "https://cdn.example.com",
      type: "url",
    })}
    <p className="text-xs text-amber-600 dark:text-amber-400">
      {t("credentials_warning")}
    </p>
  </div>
)}
      </section>

      <div className="flex items-center gap-4">
       <button
  type="submit"
  disabled={isSubmitting}
  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors disabled:opacity-50"
>
  {isSubmitting ? t("saving") : t("save_settings")}
</button>
      </div>
    </form>
  );
}
