"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function SyncStatusBadge() {
  const status = useOnlineStatus();

  const config = {
    offline: {
      label: "Oflayn",
      shortLabel: "", // mobil uchun bo'sh
      icon: WifiOff,
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    syncing: {
      label: "Sinxronlash",
      shortLabel: "",
      icon: RefreshCw,
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    synced: {
      label: "Sinxronlashtirilgan",
      shortLabel: "",
      icon: Wifi,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      data-sync-status={status}
      title={config.label}
      aria-label={config.label}
      className={cn(
        // Layout — mobil: faqat ikonka, planshet+: matn bilan
        "inline-flex items-center justify-center gap-1.5",
        // O'lcham — mobil kichikroq
        "h-8 w-8 sm:h-auto sm:w-auto sm:px-2.5 sm:py-1",
        "rounded-full",
        // Typography
        "text-xs font-medium",
        // Transition
        "transition-colors",
        // Print
        "print:hidden",
        config.className
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0",
          status === "syncing" && "animate-spin"
        )}
      />
      {/* Matn — faqat sm (640px) va undan katta ekranlarda */}
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}