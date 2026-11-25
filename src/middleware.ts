import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/ping",
] as const;

const SETUP_PATHS = ["/setup", "/api/setup"] as const;

const STATIC_FILE_RE =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|webmanifest|map)$/i;

const INTERNAL_PREFIXES = [
  "/_next",
  "/favicon",
  "/manifest",
  "/icons",
  "/sw.js",
  "/uploads",
] as const;

const SETUP_COOKIE = "sotuvon-setup-complete";


function isInternalPath(pathname: string): boolean {
  return (
    INTERNAL_PREFIXES.some((p) => pathname.startsWith(p)) ||
    STATIC_FILE_RE.test(pathname)
  );
}

function isSetupPath(pathname: string): boolean {
  return SETUP_PATHS.some((p) => pathname.startsWith(p));
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function redirectOrJson(
  request: NextRequest,
  target: string,
  status: number,
  message: string,
): NextResponse {
  if (isApiPath(request.nextUrl.pathname)) {
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.redirect(new URL(target, request.url));
}

function isSetupComplete(request: NextRequest): boolean {
  const cookieDone = request.cookies.get(SETUP_COOKIE)?.value === "1";
  const hasEnv = Boolean(
    process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET,
  );
  return cookieDone && hasEnv;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isInternalPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/api/ping") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const setupComplete = isSetupComplete(request);
  const onSetupPath = isSetupPath(pathname);

  if (setupComplete && onSetupPath) {
    return redirectOrJson(
      request,
      "/login",
      404,
      "Setup allaqachon tugagan",
    );
  }

  if (!setupComplete && !onSetupPath) {
    return redirectOrJson(
      request,
      "/setup",
      503,
      "Setup hali tugamagan. /setup sahifasiga o'ting.",
    );
  }

  if (onSetupPath) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  const hasSession = Boolean(sessionCookie);

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
   
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|webmanifest|map)).*)",
  ],
};