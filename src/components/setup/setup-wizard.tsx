"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupStatus {
  envOk: boolean;
  dbConnected: boolean;
  dbInitialized: boolean;
  hasAdmin: boolean;
  setupComplete: boolean;
  missingEnv: string[];
  dbError?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Xush kelibsiz",
  "Tizim tekshiruvi",
  "Malumotlar bazasi",
  "Administrator hisobi",
  "Biznes haqida ma'lumot",
  "Bajarildi!",
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span className={`text-sm ${ok ? "text-gray-700" : "text-red-500"}`}>{label}</span>
    </div>
  );
}

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-2 rounded-lg bg-gray-900 border border-gray-700">
      <pre className="p-3 pr-16 text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
      >
        {copied ? "Nusxalangan!" : "Nusxa"}
      </button>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/80 overflow-hidden">
      {children}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / (total - 1)) * 100);
  return (
    <div className="w-full max-w-lg mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>
          Qadam {step + 1} ning {total}
        </span>
        <span>{STEP_LABELS[step]}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-[#f5c518] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step 0 — Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const features = [
    { icon: "📡", text: "Oflayn rejimda ishlaydi - hech qachon chegirmalarni yo'qotmang" },
    { icon: "🖨️", text: "Terminal va brauzer cheklarini chop etish" },
    { icon: "👥", text: "Administrator + kassir rolini boshqarish" },
    { icon: "📊", text: "Kundalik hisobotlar va CSV eksporti" },
    { icon: "🎨", text: "Maxsus brend ranglari va logotipi" },
  ];

  return (
    <StepCard>
      <div className="px-8 py-10 text-center">
        <div className="text-5xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-[#0f2044] mb-2">SotuvOnga xush kelibsiz</h1>
        <p className="text-gray-500 mb-8">
          Keling, do'koningizni bir necha qadamda o'rnatamiz. Texnik bilim talab qilinmaydi.
        </p>
        <ul className="text-left space-y-3 mb-10">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="text-lg">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
        <button
          onClick={onNext}
          className="w-full py-3 cursor-pointer rounded-xl bg-[#f5c518] hover:bg-yellow-400 text-[#0f2044] font-bold text-sm transition-colors shadow-md shadow-[#f5c518]/30"
        >
          Boshlash →
        </button>
      </div>
    </StepCard>
  );
}

// ─── Step 1 — System Check ────────────────────────────────────────────────────

function StepSystemCheck({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        envOk: false,
        dbConnected: false,
        dbInitialized: false,
        hasAdmin: false,
        setupComplete: false,
        missingEnv: ["DATABASE_URL", "BETTER_AUTH_SECRET"],
        dbError: "Serverga ulanib bo'lmadi.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const missingDbUrl = status?.missingEnv.includes("DATABASE_URL");
  const missingSecret = status?.missingEnv.includes("BETTER_AUTH_SECRET");

  return (
    <StepCard>
      <div className="px-6 pt-8 pb-2">
        <h2 className="text-xl font-bold text-[#0f2044] mb-1">Tizim tekshiruvi</h2>
        <p className="text-sm text-gray-500 mb-6">
          Biz sizning muhit o'zgaruvchilaringiz to'g'ri sozlanganligini tekshiramiz.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
            <Spinner /> Konfiguratsiyangiz tekshirilmoqda…
          </div>
        )}

        {!loading && status && (
          <div className="space-y-1">
            <Check
              ok={!missingDbUrl}
              label={
                missingDbUrl
                  ? "DATABASE_URL — o'rnatilmagan (talab qilinadi)"
                  : "DATABASE_URL — sozlangan ✓"
              }
            />
            <Check
              ok={!missingSecret}
              label={
                missingSecret
                  ? "BETTER_AUTH_SECRET —  (talab qilinadi)"
                  : "BETTER_AUTH_SECRET — sozlangan ✓"
              }
            />
          </div>
        )}

        {!loading && status && !status.envOk && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Qanday tuzatish kerak
            </p>
            <Collapsible title="📄 Create a .env.local file">
              <p className="mt-3 mb-2 text-gray-600">
                Nomli fayl yarating <code className="text-[#0f2044] font-semibold">.env.local</code> loyihangizning asosiy qismida quyidagi tarkib bilan:
              </p>
              <CopyBlock
                code={`DATABASE_URL="postgresql://olgax:olgax@localhost:5432/olgax_pos"
BETTER_AUTH_SECRET="${Array.from(crypto.getRandomValues(new Uint8Array(32)))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("")}"`}
              />
              <p className="mt-3 text-gray-400 text-xs">
                After saving, restart the dev server with{" "}
                <code className="text-[#0f2044] font-semibold">pnpm dev</code> and click{" "}
                <strong>Qayta tekshiring</strong>.
              </p>
            </Collapsible>

            <Collapsible title="🐋 Start PostgreSQL with Docker">
              <p className="mt-3 mb-2 text-gray-600">
                If you don&apos;t have PostgreSQL running, start it with Docker:
              </p>
              <CopyBlock code="docker compose up -d postgres" />
              <p className="mt-2 text-gray-600">
                Don&apos;t have Docker? Download it at{" "}
                <a
                  href="https://docker.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0f2044] underline font-medium"
                >
                  docker.com
                </a>
              </p>
            </Collapsible>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 mt-4">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={check}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner /> : "Check Again"}
          </button>
          <button
            onClick={onNext}
            disabled={!status?.envOk || loading}
            className="px-5 py-2 rounded-lg bg-[#f5c518] hover:bg-yellow-400 text-[#0f2044] text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            Continue →
          </button>
        </div>
      </div>
    </StepCard>
  );
}

// ─── Step 2 — Database ────────────────────────────────────────────────────────

function StepDatabase({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateOutput, setMigrateOutput] = useState("");
  const [migrateError, setMigrateError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/status");
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const runMigrations = async () => {
    setMigrating(true);
    setMigrateOutput("");
    setMigrateError("");
    try {
      const res = await fetch("/api/setup/migrate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMigrateOutput(data.output || "Ma'lumotlar bazasi muvaffaqiyatli ishga tushirildi.");
        await checkStatus();
      } else {
        setMigrateError(data.error || "Migratsiya amalga oshmadi.");
      }
    } catch {
      setMigrateError("Serverga ulanib bo'lmadi.");
    } finally {
      setMigrating(false);
    }
  };

  const canContinue = status?.dbConnected && status?.dbInitialized;

  return (
    <StepCard>
      <div className="px-6 pt-8 pb-2">
        <h2 className="text-xl font-bold text-[#0f2044] mb-1">Ma'lumotlar bazasini sozlash</h2>
        <p className="text-sm text-gray-500 mb-6">
PostgreSQL ma'lumotlar bazangizga ulaning va jadvallarni ishga tushiring.        </p>

        {(loading || migrating) && (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-4 justify-center">
            <Spinner /> {migrating ? "Ma'lumotlar bazasi sozlamalari bajarilmoqda…" : "Ulanish sinovdan o'tkazilmoqda…"}
          </div>
        )}

        {!loading && status && (
          <div className="space-y-1">
            {status.dbConnected ? (
              <div className="flex items-center gap-3 py-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                <span className="text-sm text-gray-700 font-medium">Ma'lumotlar bazasi ulanishi — Muvaffaqiyatli ulandi</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">✗</span>
                <span className="text-sm text-red-500 font-medium">Ma'lumotlar bazasi ulanishi — Ulanish amalga oshmadi</span>
              </div>
            )}

            {status.dbConnected && (
              status.dbInitialized ? (
                <div className="flex items-center gap-3 py-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="text-sm text-gray-700 font-medium">Ma'lumotlar bazasi jadvallari — Sxema yangilangan</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">!</span>
                  <span className="text-sm text-amber-600 font-medium">Ma'lumotlar bazasi jadvallari — Boshlashga tayyor</span>
                </div>
              )
            )}
          </div>
        )}

        {!loading && status?.dbError && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-semibold text-red-600 mb-1">Connection error</p>
            <p className="text-xs text-red-500 font-mono">{status.dbError}</p>
          </div>
        )}

        {migrateOutput && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-xs text-emerald-700 font-mono whitespace-pre-wrap">{migrateOutput}</p>
          </div>
        )}

        {migrateError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
            <p className="text-xs text-red-500 font-mono whitespace-pre-wrap">{migrateError}</p>
          </div>
        )}

        {!loading && status && !status.dbConnected && (
          <Collapsible title="🐋 How to start PostgreSQL">
            <p className="mt-3 mb-2 text-gray-600">Ma'lumotlar bazasini ishga tushirish uchun ushbu buyruqni bajaring:</p>
            <CopyBlock code="docker compose up -d postgres" />
            <p className="mt-2 text-gray-400 text-xs">
              Then click <strong>Sinov ulanishi</strong> yana.
            </p>
          </Collapsible>
        )}

        {!loading && status?.dbConnected && !status.dbInitialized && !migrateOutput && (
          <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Boshlashga tayyor!</strong>   Barcha kerakli ma'lumotlar bazasi jadvallarini yaratish uchun quyidagi tugmani bosing. Bu taxminan 5–10 soniya davom etadi.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 mt-4">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Orqaga
        </button>
        <div className="flex gap-2">
          <button
            onClick={checkStatus}
            disabled={loading || migrating}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Sinov ulanishi
          </button>
          {status?.dbConnected && !status.dbInitialized && (
            <button
              onClick={runMigrations}
              disabled={migrating}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors disabled:opacity-40"
            >
              {migrating ? <Spinner /> : "Boshlang'ich holatga keltirish DB"}
            </button>
          )}
          <button
  onClick={onNext}
  disabled={!canContinue}
  style={{ cursor: canContinue ? 'pointer' : 'not-allowed' }}
  className="px-5 py-2 rounded-lg bg-[#f5c518] hover:bg-yellow-400 text-[#0f2044] text-sm font-bold transition-colors disabled:opacity-30 shadow-sm"
>
  Davom etish →
</button>
        </div>
      </div>
    </StepCard>
  );
}

// ─── Step 3 — Admin Account ───────────────────────────────────────────────────

function StepAdminAccount({
  onNext,
  onBack,
  setAdminEmail,
}: {
  onNext: () => void;
  onBack: () => void;
  setAdminEmail: (e: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (name.trim().length < 2) return "Ism kamida 2 ta belgidan iborat bo'lishi kerak.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Iltimos, to'g'ri e-pochta manzilini kiriting.";
    if (password.length < 8) return "Parol kamida 8 ta belgidan iborat bo'lishi kerak.";
    if (password !== confirm) return "Parollar mos kelmayapti.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdminEmail(data.email);
        onNext();
      } else {
        setError(typeof data.error === "string" ? data.error : "Hisob yaratib bo'lmadi.");
      }
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0f2044] focus:bg-white focus:ring-2 focus:ring-[#0f2044]/10";

  return (
    <StepCard>
      <form onSubmit={submit}>
        <div className="px-6 pt-8 pb-2">
          <h2 className="text-xl font-bold text-[#0f2044] mb-1">  Administrator hisobini yaratish</h2>
          <p className="text-sm text-gray-500 mb-6">
            Bu hisob barcha sozlamalar va hisobotlarga to'liq kirish huquqiga ega bo'ladi.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">To'liq ism</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Umidjon"
                autoComplete="name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="umid@mystore.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kamida 8 ta belgi"
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
               Parolni tasdiqlang
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Parolingizni takrorlang"
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Orqaga
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[#f5c518] hover:bg-yellow-400 text-[#0f2044] text-sm font-bold transition-colors disabled:opacity-40 flex items-center gap-2 shadow-sm"
          >
            {loading && <Spinner />} Hisob yaratish →
          </button>
        </div>
      </form>
    </StepCard>
  );
}

// ─── Step 4 — Business Settings ───────────────────────────────────────────────

function StepBusinessSettings({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("so'm");
  const [currencyDecimals, setCurrencyDecimals] = useState("0");
  const [taxRate, setTaxRate] = useState("12");
  const [taxName, setTaxName] = useState("QQS");
  const [receiptFooter, setReceiptFooter] = useState("Xaridingiz uchun tashakkur!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) { setError("Business name is required."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          currency,
          currencyDecimals: Number(currencyDecimals),
          taxRate: Number(taxRate),
          taxName,
          receiptFooter,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onNext();
      } else {
        setError(typeof data.error === "string" ? data.error : "Sozlamalarni saqlab bo'lmadi.");
      }
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0f2044] focus:bg-white focus:ring-2 focus:ring-[#0f2044]/10";

  return (
    <StepCard>
      <form onSubmit={submit}>
        <div className="px-6 pt-8 pb-2">
          <h2 className="text-xl font-bold text-[#0f2044] mb-1">Biznes haqida ma'lumot</h2>
          <p className="text-sm text-gray-500 mb-6">
            Bu sizning cheklaringizda va SotuvOn-terminalda ko'rinadi. Keyinroq uni Sozlamalar bo'limida o'zgartirishingiz mumkin.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Biznes nomi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mening ajoyib do'konim"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Valyuta belgisi
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  maxLength={5}
                  placeholder="sum"
                  className={inputClass}
                />
              </div>
             <div>
  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
    O'nlik kasrlar
  </label>
  <select
    value={currencyDecimals}
    onChange={(e) => setCurrencyDecimals(e.target.value)}
    className={inputClass}
  >
    <option value="0">0 (masalan, 15 000 so'm)</option>
    <option value="2">2 (masalan, 15 000.00 so'm)</option>
    <option value="3">3 (masalan, 15 000.000 so'm)</option>
  </select>
</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Soliq stavkasi(%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Soliq nomi</label>
                <input
                  type="text"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="Nomi"
                  maxLength={30}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Chek pastki qismi <span className="text-gray-400 font-normal normal-case">(ixtiyoriy)</span>
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                maxLength={200}
                placeholder="Xaridingiz uchun tashakkur!"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            ← Orqaga
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 cursor-pointer rounded-lg bg-[#f5c518] hover:bg-yellow-400 text-[#0f2044] text-sm font-bold transition-colors disabled:opacity-40 flex items-center gap-2 shadow-sm"
          >
            {loading && <Spinner />} Saqlash va ishga tushirish →
          </button>
        </div>
      </form>
    </StepCard>
  );
}

// ─── Step 5 — Done! ───────────────────────────────────────────────────────────

function StepDone({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();

  return (
    <StepCard>
      <div className="px-8 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl text-emerald-600 mx-auto mb-6">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-[#0f2044] mb-2">Hammasi tayyor!</h2>
        <p className="text-gray-500 mb-2">SotuvOn qurilmangiz foydalanishga tayyor.</p>
        {adminEmail && (
          <p className="text-sm text-gray-400 mb-8">
            Administrator hisobi:{" "}
            <span className="text-[#0f2044] font-semibold">{adminEmail}</span>
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push("/pos")}
            className="w-full py-3 rounded-xl bg-[#f5c518] hover:bg-yellow-400 text-[#0f2044] font-bold text-sm transition-colors shadow-md shadow-[#f5c518]/30"
          >
             Ochiq SotuvOn →
          </button>
          <button
            onClick={() => router.push("/products")}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
          >
            Avval mahsulotlarni qo'shing
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Siz biznesingiz sozlamalarini istalgan vaqtda o'zgartirishingiz mumkin{" "}
          <button
            onClick={() => router.push("/settings")}
            className="text-[#0f2044] underline font-medium"
          >
            Sozlamalar
          </button>{" "}
          sahifa.
        </p>
      </div>
    </StepCard>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");

  // On mount: if already set up, redirect to login
  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((data: SetupStatus) => {
        if (data.setupComplete) {
          router.replace("/login");
        }
      })
      .catch(() => {});
  }, [router]);

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex flex-col items-center w-full">
      {step < STEP_LABELS.length - 1 && (
        <ProgressBar step={step} total={STEP_LABELS.length} />
      )}

      {step === 0 && <StepWelcome onNext={next} />}
      {step === 1 && <StepSystemCheck onNext={next} onBack={back} />}
      {step === 2 && <StepDatabase onNext={next} onBack={back} />}
      {step === 3 && (
        <StepAdminAccount onNext={next} onBack={back} setAdminEmail={setAdminEmail} />
      )}
      {step === 4 && <StepBusinessSettings onNext={next} onBack={back} />}
      {step === 5 && <StepDone adminEmail={adminEmail} />}
    </div>
  );
}
