import { NextResponse } from "next/server";
import { ROLES } from "./src/constants/roles";

const ROLE_GATES = [
  { prefix: "/dashboard/admin", roles: [ROLES.ADMIN] },
  { prefix: "/dashboard/technician", roles: [ROLES.ADMIN, ROLES.TECHNICIAN] },
  { prefix: "/dashboard/client", roles: [ROLES.ADMIN, ROLES.CLIENT] },
];

const resolveDashboardHome = (role) => {
  if (role === ROLES.ADMIN) {
    return "/dashboard/admin";
  }
  if (role === ROLES.TECHNICIAN) {
    return "/dashboard/technician";
  }
  if (role === ROLES.CLIENT) {
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
  const role = request.cookies.get("th_role")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
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
