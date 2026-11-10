"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw, Languages, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale-actions";

const LOCALES = [
  { code: "en", label: "EN", name: "English" },
  { code: "uz", label: "UZ", name: "O'zbekcha" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "ar", label: "AR", name: "العربية" },
] as const;

export function SyncStatusBadge() {
  const status = useOnlineStatus();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (status !== "synced") {
    const config = {
      offline: {
        label: "Offline",
        icon: WifiOff,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      syncing: {
        label: "Syncing",
        icon: RefreshCw,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
    }[status as "offline" | "syncing"];

    const Icon = config.icon;
    return (
      <span
        data-sync-status={status}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          config.className
        )}
      >
        <Icon className={cn("h-3 w-3", status === "syncing" && "animate-spin")} />
        {config.label}
      </span>
    );
  }

  async function handleSelect(code: string) {
    setOpen(false);
    if (code === locale) return;
    setSaving(true);
    try {
      await setLocale(code);      
      router.refresh();            
    } finally {
      setSaving(false);
    }
  }

  const active = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        aria-label="Change language"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          "bg-green-100 text-green-800 hover:bg-green-200",
          "dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
          saving && "opacity-60 cursor-wait"
        )}
      >
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Languages className="h-3 w-3" />
        )}
        {active.label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 top-full z-50 mt-1 min-w-[150px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            {LOCALES.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                    l.code === locale && "font-semibold text-primary"
                  )}
                >
                  <span>{l.name}</span>
                  <span className="text-muted-foreground">{l.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}