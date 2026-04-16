import { NextResponse } from "next/server";
import { ROLES } from "./src/constants/roles";

const ROLE_GATES = [
  { prefix: "/dashboard/admin", roles: [ROLES.ADMIN] },
  { prefix: "/dashboard/technician", roles: [ROLES.ADMIN, ROLES.TECHNICIAN] },
];

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
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
