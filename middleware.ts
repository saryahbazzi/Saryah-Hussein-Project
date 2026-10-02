import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);
const PROTECTED = new Set(["dashboard", "events", "checkin", "admin"]);

export default async function middleware(req: NextRequest) {
  const res = intl(req);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return res;

  const [, locale, area] = req.nextUrl.pathname.split("/");
  const isProtected = PROTECTED.has(area ?? "");
  const hasSession = req.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  // Public pages with no session cookie skip the auth round-trip entirely.
  if (!isProtected && !hasSession) return res;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser(); // refreshes the session cookie when needed

  if (isProtected && !user) {
    const login = req.nextUrl.clone();
    login.pathname = `/${locale}/login`;
    login.search = "";
    login.searchParams.set("next", req.nextUrl.pathname.replace(`/${locale}`, "") + req.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
