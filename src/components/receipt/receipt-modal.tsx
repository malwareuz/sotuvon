"use client";

import { useRef } from "react";
import { X, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Receipt } from "./receipt";
import { printReceipt } from "@/lib/thermal-print";

interface ReceiptSettings {
  name: string;
  logoUrl: string | null;
  currency: string;
  currencyDecimals: number;
  taxName: string;
  receiptFooter: string;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    saleId?: string;
    items: ReceiptItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    amountTendered?: number;
    changeDue?: number;
  };
  settings: ReceiptSettings;
}

export function ReceiptModal({ open, onClose, data, settings }: ReceiptModalProps) {
  const t = useTranslations("receipts");
  const printRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  function handleBrowserPrint() {
    setTimeout(() => {
      window.print();
    }, 100);
  }

  async function handleThermalPrint() {
    await printReceipt({
      data,
      settings: {
        ...settings,
        labels: {
          subtotal: t("subtotal"),
          discount: t("discount"),
          total: t("total"),
          payment: t("payment"),
          tendered: t("amount_tendered"),
          changeDue: t("change_due"),
          cash: t("cash"),
          card: t("card"),
          other: t("other"),
        },
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Print styles: when printing, only show receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-overlay,
          #receipt-print-overlay * {
            visibility: visible;
          }
          #receipt-print-overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 10px;
            margin: 0;
            transform: scale(0.9);
            transform-origin: top left;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>

      <div id="receipt-print-overlay" className="w-full max-w-sm rounded-xl bg-white border shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="no-print flex items-center justify-between border-b px-4 py-3 bg-card">
          <h2 className="font-semibold text-sm">{t("receipt_preview")}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleThermalPrint}
              title={t("thermal_print_title")}
              className="rounded border px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-accent transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              {t("thermal")}
            </button>
            <button
              onClick={handleBrowserPrint}
              className="rounded bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              {t("print")}
            </button>
            <button onClick={onClose} className="rounded p-1 hover:bg-accent transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Receipt preview */}
        <div ref={printRef} className="overflow-y-auto max-h-[70vh] bg-white p-4">
          <Receipt data={data} settings={settings} />
        </div>
      </div>
    </div>
  );
}