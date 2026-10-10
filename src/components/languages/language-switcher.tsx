"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Check, ChevronDown, Globe, Search } from "lucide-react";

const LOCALES = [
  { code: "uz", label: "O'zbekcha",        flag: "🇺🇿" },
  { code: "ru", label: "Русский",          flag: "🇷🇺" },
  { code: "en", label: "English",          flag: "🇬🇧" },
  { code: "ar", label: "العربية",          flag: "🇸🇦" },
  { code: "zh", label: "中文",              flag: "🇨🇳" },
  { code: "fr", label: "Français",         flag: "🇫🇷" },
  { code: "de", label: "Deutsch",          flag: "🇩🇪" },
  { code: "es", label: "Español",          flag: "🇪🇸" },
  { code: "hi", label: "हिन्दी",             flag: "🇮🇳" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語",            flag: "🇯🇵" },
  { code: "ko", label: "한국어",             flag: "🇰🇷" },
  { code: "pt", label: "Português",        flag: "🇵🇹" },
  { code: "si", label: "සිංහල",              flag: "🇱🇰" },
  { code: "ta", label: "தமிழ்",              flag: "🇱🇰" },
] as const;

type Locale = (typeof LOCALES)[number]["code"];

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  // Ekran o'lchamini kuzatish
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return LOCALES;
    const q = query.toLowerCase();
    return LOCALES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  // Tashqariga bosilganda yopish
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ESC bosilganda yopish
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Body scroll'ni bloklash (mobil drawer uchun)
  useEffect(() => {
    if (open && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open, isMobile]);

  function handleChange(code: Locale) {
    document.cookie = `olgax_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* ===== Trigger tugma ===== */}
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={[
          // Layout — mobil va desktop uchun
          "inline-flex items-center justify-center gap-1.5 sm:gap-2",
          // O'lcham — mobil kichikroq, desktop kattaroq
          "h-8 w-8 sm:h-9 sm:w-auto sm:px-3",
          "rounded-md",
          // Border & background
          "border border-border bg-background",
          // Typography
          "text-sm font-medium text-foreground",
          // Hover & focus
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Transition
          "transition-colors duration-150",
          // Disabled
          "disabled:opacity-50 disabled:pointer-events-none",
          // Open
          open && "bg-accent",
          // Print
          "print:hidden",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Globe ikonka — mobil uchun */}
        <Globe className="h-4 w-4 shrink-0 sm:hidden" />

        {/* Flag + kod — planshet+ uchun */}
        <span className="hidden sm:inline text-base leading-none">
          {current.flag}
        </span>
        <span className="hidden md:inline text-xs font-semibold tracking-wide">
          {current.code.toUpperCase()}
        </span>

        {/* Chevron — planshet+ uchun */}
        <ChevronDown
          className={[
            "hidden sm:block h-3.5 w-3.5 shrink-0 text-muted-foreground",
            "transition-transform duration-200",
            open && "rotate-180",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </button>

      {/* ===== Dropdown / Drawer ===== */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className={[
              "fixed inset-0 z-40",
              // Mobil — qoraytirilgan fon, desktop — shaffof
              "bg-black/40 sm:bg-transparent",
              // Animatsiya
              "animate-in fade-in-0 duration-150",
            ].join(" ")}
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
            aria-hidden="true"
          />

          {/* Panel — mobil uchun bottom sheet, desktop uchun dropdown */}
          <div
            role="listbox"
            className={[
              // Position
              "fixed sm:absolute z-50",
              // Mobil: pastdan chiqadi, to'liq kenglik
              "inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto",
              // Desktop: o'ng tomonda, trigger ostida
              "sm:right-0 sm:top-full sm:mt-2",
              // Kenglik
              "w-full sm:w-64 md:w-72 lg:w-80",
              // Balandlik — mobil to'liq ekranning 70% gacha
              "max-h-[70vh] sm:max-h-[400px]",
              // Appearance
              "bg-popover text-popover-foreground",
              "border border-border",
              // Mobil: yuqori burchaklar yumaloq, desktop: hammasi
              "rounded-t-2xl sm:rounded-md",
              // Shadow
              "shadow-2xl sm:shadow-lg",
              // Animation
              "animate-in slide-in-from-bottom-4 sm:slide-in-from-top-2 fade-in-0 zoom-in-95 duration-200",
              // Overflow
              "overflow-hidden",
              "flex flex-col",
            ].join(" ")}
          >
            {/* ===== Mobil handle bar ===== */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* ===== Header (mobil uchun sarlavha) ===== */}
            <div className="sm:hidden px-4 pt-2 pb-3 border-b border-border">
              <h3 className="text-sm font-semibold">Tilni tanlang</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {LOCALES.length} ta til mavjud
              </p>
            </div>

            {/* ===== Search ===== */}
            <div className="p-2 sm:p-2 border-b border-border">
              <div
                className={[
                  "flex items-center gap-2 h-9 sm:h-8 px-3 sm:px-2",
                  "rounded-md bg-muted/50",
                  "focus-within:ring-1 focus-within:ring-ring",
                ].join(" ")}
              >
                <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search language..."
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ===== Tillar ro'yxati ===== */}
            <div
              role="listbox"
              className="flex-1 overflow-y-auto overscroll-contain py-1"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Hech narsa topilmadi
                </div>
              ) : (
                filtered.map((locale) => {
                  const active = locale.code === currentLocale;
                  return (
                    <button
                      key={locale.code}
                      role="option"
                      aria-selected={active}
                      onClick={() => handleChange(locale.code)}
                      className={[
                        // Layout
                        "w-full flex items-center gap-3 sm:gap-2.5",
                        "px-4 sm:px-3 py-3 sm:py-2",
                        // Typography
                        "text-sm text-left",
                        // Colors
                        active
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-foreground hover:bg-accent/50 active:bg-accent/70",
                        // Transition
                        "transition-colors duration-100",
                        // Focus
                        "focus-visible:outline-none focus-visible:bg-accent",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="text-xl sm:text-base leading-none shrink-0">
                        {locale.flag}
                      </span>
                      <span className="flex-1 truncate font-medium sm:font-normal">
                        {locale.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                        {locale.code}
                      </span>
                      {active && (
                        <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}