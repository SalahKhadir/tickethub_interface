import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthGate from "@/components/features/AuthGate";
import DashboardLogoutButton from "@/components/features/DashboardLogoutButton";
import { Lock, Wrench, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Dashboard | TicketHub",
};

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("th_token")?.value;
  const role = cookieStore.get("th_role")?.value;
  const enabled = cookieStore.get("th_enabled")?.value;

  if (!token || !role) {
    redirect("/login?redirect=/dashboard");
  }

  if (enabled === "false") {
    redirect("/login?pending=1");
  }

  const roleNormalized = (role || "").toLowerCase();

  // Current role display (non-clickable)
  let rolePillBg = "bg-blue-500/20";
  let rolePillText = "text-blue-100";
  let roleLabel = "Client";
  let RoleIcon = CheckCircle;
  
  // Default styling (Client)
  let headerBg = "bg-[#0F172A]"; // Slate 900 - distinct from Admin's #111C2D
  let titleColor = "text-white";
  let subtitleColor = "text-blue-400";
  let borderColor = "border-slate-800";

  if (roleNormalized === "admin") {
    rolePillBg = "bg-royal-blue";
    rolePillText = "text-white";
    roleLabel = "Admin";
    RoleIcon = Lock;
    headerBg = "bg-white/90 backdrop-blur-sm";
    titleColor = "text-ink-black";
    subtitleColor = "text-slate-grey";
    borderColor = "border-[rgba(17,24,39,0.08)]";
  } else if (roleNormalized === "technician") {
    rolePillBg = "bg-ink-black";
    rolePillText = "text-white";
    roleLabel = "Tech";
    RoleIcon = Wrench;
    headerBg = "bg-white/90 backdrop-blur-sm";
    titleColor = "text-ink-black";
    subtitleColor = "text-slate-grey";
    borderColor = "border-[rgba(17,24,39,0.08)]";
  }

  return (
    <div className="min-h-screen bg-bright-snow">
      <header className={`border-b ${borderColor} ${headerBg} ${(roleNormalized === "admin" || roleNormalized === "technician") ? "ml-64" : ""}`}>
        <div className={`mx-auto flex w-full items-center justify-between py-4 ${(roleNormalized === "admin" || roleNormalized === "technician") ? "max-w-7xl px-8" : "max-w-6xl px-6"}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded shrink-0">
              <Image src="/TicketHub_LogoNOBG.png" alt="TicketHub" width={32} height={32} priority />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${subtitleColor}`}>
                TicketHub
              </p>
              <h1 className={`text-lg font-semibold ${titleColor}`}>Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${rolePillBg} ${rolePillText}`}
            >
              <RoleIcon size={16} />
              {roleLabel}
            </div>
            <DashboardLogoutButton />
          </div>
        </div>
      </header>
      <main className="w-full">
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
