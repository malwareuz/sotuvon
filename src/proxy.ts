import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — Edge runtime.
 *
 * Vazifasi:
 *  1. Statik fayllarni va Next.js ichki yo'llarini o'tkazib yuborish.
 *  2. Setup tugallanganini cookie orqali tekshirish.
 *  3. Sessiya cookie mavjudligini tekshirish (to'liq validatsiya Server Component'larda).
 *  4. Redirect qoidalari: setup → login → pos.
 *
 * MUHIM: Edge runtime'da faqat cookie va env tekshiriladi.
 * Ma'lumotlar bazasiga so'rov yuborilmaydi (bu Server Component'larning ishi).
 */

// Ochiq yo'llar — autentifikatsiya talab qilinmaydi
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/setup",
  "/api/setup",
  "/api/ping",
] as const;

// Setup tugallanganini bildiruvchi cookie nomi
const SETUP_COOKIE = "olgax-setup-complete";

// Better Auth sessiya cookie nomlari (HTTP va HTTPS uchun)
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // 1. Statik resurslar va Next.js ichki yo'llari — hech qanday tekshiruvsiz o'tkazamiz
  // ─────────────────────────────────────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icons") ||
    pathname === "/sw.js" ||
    pathname.startsWith("/uploads") ||
    /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|webmanifest)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Setup holatini aniqlash
  // ─────────────────────────────────────────────────────────────
  const setupDone = request.cookies.get(SETUP_COOKIE)?.value === "1";
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasAuthSecret = Boolean(process.env.BETTER_AUTH_SECRET);

  const isSetupPath =
    pathname.startsWith("/setup") || pathname.startsWith("/api/setup");

  // Setup tugallangan bo'lsa, /setup ga kirishni bloklaymiz
  if (setupDone && isSetupPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth API yo'llari har doim ochiq (sign-in, sign-out, session)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Setup tugallanmagan bo'lsa — faqat /setup va /api/setup ga ruxsat
  if ((!setupDone || !hasDbUrl || !hasAuthSecret) && !isSetupPath) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Sessiya mavjudligini aniqlash (faqat cookie mavjudligi)
  // ─────────────────────────────────────────────────────────────
  const hasSession = SESSION_COOKIES.some(
    (name) => Boolean(request.cookies.get(name)?.value)
  );

  // ─────────────────────────────────────────────────────────────
  // 4. Redirect qoidalari
  // ─────────────────────────────────────────────────────────────

  // Ochiq yo'llar — login sahifasi va boshqalar
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublicPath) {
    // Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa va /login ga kirmoqchi bo'lsa — /pos ga yuboramiz
    if (hasSession && pathname === "/login") {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
    return NextResponse.next();
  }

  // Himoyalangan yo'l — sessiya bo'lmasa, /login ga yuboramiz
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Ixtiyoriy: qaytish manzilini saqlash
    // loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Sessiya mavjud — davom etamiz
  return NextResponse.next();
}

export const config = {
  /**
   * Matcher — middleware qaysi yo'llarda ishlashini belgilaydi.
   * Statik fayllar va Next.js ichki resurslari chiqarib tashlangan.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|webmanifest)).*)",
  ],
};