"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "sotuvon_splash_seen";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY) === "true") {
      return;
    }

    // Shu sessiya uchun belgilab qo'yamiz
    sessionStorage.setItem(SPLASH_KEY, "true");

    setVisible(true);

    const start = window.setTimeout(() => {
      setProgress(100);
    }, 150);

    const exit = window.setTimeout(() => {
      setExiting(true);
    }, 4600);

    const finish = window.setTimeout(() => {
      setVisible(false);
    }, 8100);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(exit);
      window.clearTimeout(finish);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Sotuvon yuklanmoqda"
      className={`fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-[#050914] text-white transition-all duration-500 ${
        exiting
          ? "scale-[1.04] opacity-0 pointer-events-none"
          : "scale-100 opacity-100"
      }`}
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,190,255,0.16),transparent_55%)]" />

      <div className="absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />

      <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-cyan-400/20 blur-[120px] animate-pulse" />

      {/* GRID */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.2) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
          maskImage:
            "radial-gradient(ellipse at center, black 10%, transparent 75%)",
        }}
      />

      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_12px_#00d9ff] animate-ping"
          style={{
            left: `${(i * 47) % 100}%`,
            top: `${(i * 67) % 100}%`,
            animationDelay: `${(i % 7) * 0.3}s`,
            animationDuration: `${2 + (i % 4)}s`,
          }}
        />
      ))}

      <div className="relative z-10 flex w-[90%] max-w-md flex-col items-center text-center animate-[fadeIn_1s_ease-out]">

        <div className="relative mb-10 flex h-44 w-44 items-center justify-center">

          <div className="absolute inset-0 rounded-full border border-cyan-400/30 border-t-cyan-300 animate-spin [animation-duration:5s]" />

          <div className="absolute inset-4 rounded-full border border-blue-400/30 border-b-cyan-300 animate-spin [animation-duration:3s] [animation-direction:reverse]" />

          <div className="absolute inset-8 rounded-full border border-cyan-300/20 animate-pulse" />

          <div className="absolute h-28 w-28 rounded-full bg-cyan-400/30 blur-3xl animate-pulse" />

          <div className="relative flex h-24 w-24 rotate-[-45deg] items-center justify-center rounded-[28px] border border-cyan-300/60 bg-gradient-to-br from-cyan-400/25 to-blue-600/20 shadow-[0_0_45px_rgba(0,200,255,0.3)] animate-pulse">

            <svg
              viewBox="0 0 100 100"
              fill="none"
              className="h-16 w-16 rotate-45 text-cyan-200 drop-shadow-[0_0_10px_rgba(0,220,255,0.9)]"
            >
              <path
                d="M15 35L50 15L85 35V75L50 95L15 75V35Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M15 35L50 55L85 35"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M50 55V95"
                stroke="currentColor"
                strokeWidth="3"
              />

              <path
                d="M33 45V64L50 74L67 64V45"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-4xl font-black tracking-[0.3em] text-transparent sm:text-5xl">
            SOTUV<span className="text-blue-600">On</span>
          </h1>

          <div className="mx-auto h-[2px] w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00d9ff]" />

          <p className="text-[10px] font-semibold tracking-[0.4em] text-cyan-200/70">
            SMART RETAIL MANAGEMENT
          </p>
          <div>
             <h2 className="mt-6 animate-[fadeIn_1.2s_ease-out_0.3s_both] text-xl font-medium tracking-wide text-cyan-100/90">
    Xush kelibsiz! 
  </h2>
          </div>
        </div>

        <div className="mt-16 w-full max-w-[280px]">

          <div className="mb-3 flex items-center justify-between text-[9px] font-bold tracking-[0.2em] text-cyan-200/80">
            <span>INITIALIZATSIYA TIZIMI</span>
            <span className="animate-pulse">LOADING...</span>
          </div>

          <div className="h-[3px] w-full overflow-hidden rounded-full bg-cyan-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-emerald-300 shadow-[0_0_15px_#00d9ff] transition-[width] duration-[2900ms] ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-[8px] tracking-[0.15em] text-cyan-100/40">
            <span>POWERED BY SOTUVON</span>
            <span>VERSION 1.0</span>
          </div>
        </div>
      </div>

      {/* BOTTOM TEXT */}
      <div className="absolute bottom-8 text-center text-[8px] tracking-[0.3em] text-cyan-100/30">
        KEYINGI AVLOD CHAKONA SAVDO TAJRIBASI
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(25px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-spin,
          .animate-ping,
          .animate-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}