"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";

  const tabs = [
    { label: "General", href: "/settings", id: "general", adminOnly: true },
    { label: "Users", href: "/settings/users", id: "users", adminOnly: true },
    { label: "Profile", href: "/settings/profile", id: "profile", adminOnly: false },
  ];

  // Server va client bir xil bo'lishi uchun:
  // mounted bo'lmaguncha faqat hamma ko'radigan tab'larni ko'rsatamiz
  const visibleTabs = mounted
    ? tabs.filter((tab) => !tab.adminOnly || isAdmin)
    : tabs.filter((tab) => !tab.adminOnly);

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="flex max-w-4xl px-4 sm:px-6">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                pathname === tab.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}