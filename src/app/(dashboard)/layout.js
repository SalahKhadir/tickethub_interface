import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthGate from "@/components/features/AuthGate";

export const metadata = {
  title: "Dashboard | TicketHub",
};

export default async function DashboardRootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("th_token")?.value;
  const role  = cookieStore.get("th_role")?.value;
  const enabled = cookieStore.get("th_enabled")?.value;

  if (!token || !role) {
    redirect("/login?redirect=/dashboard");
  }

  if (enabled === "false") {
    redirect("/login?pending=1");
  }

  return <AuthGate>{children}</AuthGate>;
}
