"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "sotuvon-splash-shown";
const SPLASH_DURATION = 8_000;

export default function SplashLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Shu sessiyada loader ko'rsatilganmi?
    if (sessionStorage.getItem(STORAGE_KEY) === "true") {
      return;
    }

    // Darhol qayta ko'rsatilmasligi uchun belgini saqlaymiz.
    sessionStorage.setItem(STORAGE_KEY, "true");
    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex min-h-dvh items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
      {/* Fon dekoratsiyasi */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex w-full max-w-md flex-col items-center px-5 text-center sm:px-8">
        {/* Logo va aylanadigan halqa */}
        <div className="relative mb-8 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-400" />

          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-xl shadow-blue-900/10 dark:border-slate-800 dark:bg-slate-900 sm:h-24 sm:w-24">
            <Image
              src="/favicon.ico"
              alt="SotuvOn logotipi"
              width={64}
              height={64}
              priority
              className="h-12 w-12 object-contain sm:h-16 sm:w-16"
            />
          </div>
        </div>

        {/* Brend nomi */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Sotuv<span className="text-blue-600 dark:text-blue-400">On</span>
        </h1>

        <h2 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200 sm:text-xl">
          SotuvOn’ga xush kelibsiz!
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400 sm:max-w-sm sm:text-base">
          Savdo va biznesingizni boshqarish yanada oson!
        </p>

        {/* Yuklanish animatsiyasi */}
        <div className="mt-9 w-full max-w-56 sm:max-w-64">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-blue-600 dark:bg-blue-400" />
          </div>

          <p className="mt-3 animate-pulse text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500 sm:text-sm">
            Dastur tayyorlanmoqda...
          </p>
        </div>

        <p className="mt-12 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 sm:text-xs">
          Smart business · Simple sales
        </p>
      </div>
    </div>
  );
}
