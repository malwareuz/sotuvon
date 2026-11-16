"use client";

import { useDeviceSettings } from "@/hooks/use-device-settings";
import { printReceipt } from "@/lib/thermal-print";
import { useTranslations } from "next-intl";

const DEMO_RECEIPT = {
  data: {
    items: [{ name: "Test Item", quantity: 1, price: 1.0, total: 1.0 }],
    subtotal: 1.0,
    discountAmount: 0,
    taxAmount: 0,
    total: 1.0,
    paymentMethod: "CASH",
  },
  settings: {
    name: "SotuvOn",
    currency: "$",
    currencyDecimals: 2,
    taxName: "Tax",
    receiptFooter: "Thank you!",
  },
};

export function DeviceSettingsForm() {
  const t = useTranslations("device-set");
  const [settings, update] = useDeviceSettings();

  async function handleTestPrint() {
    if (settings.printerType === "none") {
      alert(t("printer_disabled_alert"));
      return;
    }
    const result = await printReceipt(DEMO_RECEIPT);
    if (!result.ok) alert(t("print_failed_alert", { error: result.error ?? "" }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">{t("device_preferences")}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("stored_locally")}
        </p>
      </div>

      {/* Default Payment Method */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("default_payment_method")}</label>
        <div className="flex gap-2">
          {(["CASH", "CARD", "OTHER"] as const).map((method) => (
            <button
              key={method}
              onClick={() => update({ defaultPaymentMethod: method })}
              className={
                settings.defaultPaymentMethod === method
                  ? "flex-1 rounded-md border-2 border-primary cursor-pointer bg-primary/10 py-2 text-xs font-semibold text-primary"
                  : "flex-1 rounded-md border py-2 text-xs font-medium cursor-pointer text-muted-foreground hover:bg-accent transition-colors"
              }
            >
              {method === "CASH" ? t("cash") : method === "CARD" ? t("card") : t("other")}
            </button>
          ))}
        </div>
      </div>

      {/* Sound on sale */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("sound_on_sale")}</p>
          <p className="text-xs text-muted-foreground">{t("sound_on_sale_desc")}</p>
        </div>
        <button
          role="switch"
          aria-checked={settings.soundOnSale}
          onClick={() => update({ soundOnSale: !settings.soundOnSale })}
          className={`relative inline-flex cursor-pointer h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            settings.soundOnSale ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              settings.soundOnSale ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Scanner beep */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("scanner_error_beep")}</p>
          <p className="text-xs text-muted-foreground">{t("scanner_error_beep_desc")}</p>
        </div>
        <button
          role="switch"
          aria-checked={settings.scannerBeepEnabled}
          onClick={() => update({ scannerBeepEnabled: !settings.scannerBeepEnabled })}
          className={`relative  cursor-pointer inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            settings.scannerBeepEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              settings.scannerBeepEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Printer type */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">{t("thermal_printer_connection")}</p>
          <p className="text-xs text-muted-foreground">
            {t("thermal_printer_connection_desc")}
          </p>
        </div>
        <div className="flex gap-2  cursor-pointer">
          {(
            [
              { value: "serial", label: t("usb_serial") },
              { value: "usb", label: t("webusb") },
              { value: "none", label: t("disabled") },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ printerType: value })}
              className={
                settings.printerType === value
                  ? "flex-1 rounded-md border-2  cursor-pointer border-primary bg-primary/10 py-2 text-xs font-semibold text-primary"
                  : "flex-1 rounded-md border py-2  cursor-pointer text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleTestPrint}
          disabled={settings.printerType === "none"}
          className="w-full rounded-md border border-dashed  cursor-pointer py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("test_print")}
        </button>
      </div>
    </div>
  );
}