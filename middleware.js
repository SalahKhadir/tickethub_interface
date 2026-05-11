import { NextResponse } from "next/server";
import { ROLES } from "./src/constants/roles";

const ROLE_GATES = [
  { prefix: "/dashboard/admin", roles: [ROLES.ADMIN] },
  { prefix: "/dashboard/technician", roles: [ROLES.ADMIN, ROLES.TECHNICIAN] },
  { prefix: "/dashboard/client", roles: [ROLES.ADMIN, ROLES.CLIENT] },
];

const normalizeRole = (value) => {
  if (!value) {
    return null;
  }
  const role = String(value).toLowerCase();
  if (role === "tech") {
    return ROLES.TECHNICIAN;
  }
  return role;
};

const resolveDashboardHome = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLES.ADMIN) {
    return "/dashboard/admin";
  }
  if (normalizedRole === ROLES.TECHNICIAN) {
    return "/dashboard/technician";
  }
  if (normalizedRole === ROLES.CLIENT) {
    return "/dashboard/client";
  }
  return "/dashboard";
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("th_token")?.value;
  const role = normalizeRole(request.cookies.get("th_role")?.value);
  const enabled = request.cookies.get("th_enabled")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (enabled === "false") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("pending", "1");
    return NextResponse.redirect(loginUrl);
  }

  const gate = ROLE_GATES.find((item) => pathname.startsWith(item.prefix));
  if (gate && !gate.roles.includes(role)) {
    const homeUrl = new URL(resolveDashboardHome(role), request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
