"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ShoppingCart,
  Package,
  ReceiptText,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Truck,
  Loader2,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    role?: string;
  };
  onLinkClick?: () => void;
}

const navItems = [
  { href: "/pos", key: "pos", icon: ShoppingCart, roles: ["ADMIN", "CASHIER"] },
  { href: "/products", key: "products", icon: Package, roles: ["ADMIN"] },
  { href: "/suppliers", key: "suppliers", icon: Truck, roles: ["ADMIN"] },
  { href: "/customers", key: "customers", icon: Users, roles: ["ADMIN"] },
  { href: "/sales", key: "sales", icon: ReceiptText, roles: ["ADMIN", "CASHIER"] },
  { href: "/reports", key: "reports", icon: BarChart3, roles: ["ADMIN"] },
  { href: "/subscription", key: "subscription", icon: CreditCard, roles: ["ADMIN"] },
  { href: "/settings", key: "settings", icon: Settings, roles: ["ADMIN"] },
];

export function AppSidebar({ user, onLinkClick }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const role = user.role ?? "CASHIER";
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  const handleProfileClick = () => {
    router.push("/settings/profile");
    onLinkClick?.();
    setIsMobileOpen(false);
  };

  const handleLinkClick = () => {
    onLinkClick?.();
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobil ochish tugmasi (faqat mobil ekranda ko'rinadi) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar border shadow-md lg:hidden"
        aria-label="Menyuni ochish"
      >
        <Menu className="h-5 w-5 text-sidebar-foreground" />
      </button>

      {/* Mobil orqa fon (overlay) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar paneli */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:w-56 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Yopish tugmasi (faqat mobil) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent lg:hidden"
          aria-label="Menyuni yopish"
        >
          <X className="h-4 w-4 text-sidebar-foreground" />
        </button>

        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <Link href={'/pos'} onClick={handleLinkClick}>
            <img
              src="/android-chrome-192x192.png"
              alt="Olgax POS"
              className="h-9 w-9 rounded-xl object-contain shrink-0"
            />
          </Link>
          <div className="flex-col leading-none">
            <span
              className="text-xl font-bold text-sidebar-foreground"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
            >
              Sotuv
            </span>
            <span
              className="text-xl font-bold text-blue-700"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
            >
              On
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleNav.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key as any)}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-sidebar-accent transition-colors text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none truncate text-sidebar-foreground">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">{user.email}</p>
            </div>
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center cursor-pointer gap-2 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/60 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isSigningOut ? `${t('Signing_out')}` : `${t('Sign_out')}`}
          </button>
        </div>
      </aside>
    </>
  );
}