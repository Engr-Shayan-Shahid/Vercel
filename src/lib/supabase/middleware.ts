import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  CBAM_ROLE_COOKIE,
  getDefaultHomePath,
  inferRoleFromPath,
  isExporterPath,
  isImporterPath,
  type AccountType,
} from "@/lib/auth/account-type";

const ROLE_COOKIE_OPTIONS = {
  httpOnly: false,
  maxAge: 3600,
  sameSite: "lax" as const,
  path: "/",
};

function setRoleCookie(response: NextResponse, accountType: AccountType) {
  response.cookies.set(CBAM_ROLE_COOKIE, accountType, ROLE_COOKIE_OPTIONS);
}

function clearRoleCookie(response: NextResponse) {
  response.cookies.set(CBAM_ROLE_COOKIE, "", { ...ROLE_COOKIE_OPTIONS, maxAge: 0 });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const isProtectedRoute =
      pathname === "/" ||
      pathname.startsWith("/import-logs") ||
      pathname.startsWith("/emissions-reports") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/shipments") ||
      pathname.startsWith("/exporter") ||
      pathname.startsWith("/api/import-logs") ||
      pathname.startsWith("/api/emissions-reports") ||
      pathname.startsWith("/api/proof") ||
      pathname.startsWith("/api/shipment-requests") ||
      pathname.startsWith("/api/invitations/accept");

    if (isProtectedRoute) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Server configuration error: Supabase is not configured." },
          { status: 503 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    (pathname.startsWith("/login") || pathname.startsWith("/signup")) &&
    !pathname.startsWith("/invite");
  const isImporterRoute = isImporterPath(pathname);
  const isExporterRoute = isExporterPath(pathname);
  const isProtectedRoute = isImporterRoute || isExporterRoute;
  const isProtectedApiRoute =
    pathname.startsWith("/api/import-logs") ||
    pathname.startsWith("/api/emissions-reports") ||
    pathname.startsWith("/api/proof") ||
    pathname.startsWith("/api/shipment-requests") ||
    pathname.startsWith("/api/invitations/accept");

  // --- Unauthenticated guard ---
  if (!user && (isProtectedRoute || isProtectedApiRoute) && !pathname.startsWith("/api/cbam")) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      clearRoleCookie(response);
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    url.searchParams.set("role", inferRoleFromPath(pathname));
    const response = NextResponse.redirect(url);
    clearRoleCookie(response);
    return response;
  }

  if (!user) {
    if (request.cookies.get(CBAM_ROLE_COOKIE)?.value) {
      clearRoleCookie(supabaseResponse);
    }
    return supabaseResponse;
  }

  // --- Authenticated: resolve role (cached cookie or profile query) ---
  const cachedRole = request.cookies.get(CBAM_ROLE_COOKIE)?.value;

  let accountType: AccountType;

  if (cachedRole === "importer" || cachedRole === "exporter") {
    accountType = cachedRole;
  } else {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle();

    accountType =
      (profileRow as { account_type?: string } | null)?.account_type === "exporter"
        ? "exporter"
        : "importer";
  }

  const homePath = getDefaultHomePath(accountType);

  // --- Authenticated + auth page → redirect home by role ---
  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = homePath;
    url.search = "";
    const response = NextResponse.redirect(url);
    setRoleCookie(response, accountType);
    return response;
  }

  // --- Cross-role guard ---
  // Exporter on importer-only route → redirect to /exporter
  if (accountType === "exporter" && isImporterRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/exporter";
    url.search = "";
    const response = NextResponse.redirect(url);
    setRoleCookie(response, accountType);
    return response;
  }

  // Importer on exporter-only route → redirect to /
  if (accountType === "importer" && isExporterRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const response = NextResponse.redirect(url);
    setRoleCookie(response, accountType);
    return response;
  }

  setRoleCookie(supabaseResponse, accountType);
  return supabaseResponse;
}
