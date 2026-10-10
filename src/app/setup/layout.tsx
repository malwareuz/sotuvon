import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sozlash — SotuvOn",
  description: "SotuvOn - savdo tizimi!",
};

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex flex-col items-center justify-center p-4">
      {/* Soft decorative blobs */}
      <div
        className="pointer-events-none fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #0f2044 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #f5c518 0%, transparent 70%)" }}
      />
      <header className="relative mb-8 text-center select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sotuvonn.svg"
          alt="sotuvon img"
          className="w-14 h-14 rounded-2xl shadow-md shadow-gray-200 mx-auto mb-3"
        />
        <div className="text-[#0f2044] font-bold text-xl tracking-tight">SotuvOn</div>
        <p className="mt-0.5 text-gray-500 text-sm">O'rnatish ustasi</p>
      </header>
      <div className="relative w-full">
        {children}
      </div>
    </div>
  );
}
