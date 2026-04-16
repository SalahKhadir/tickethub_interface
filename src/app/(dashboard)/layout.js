import AuthGate from "@/components/features/AuthGate";
import DashboardLogoutButton from "@/components/features/DashboardLogoutButton";

export const metadata = {
  title: "Dashboard | TicketHub",
};

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-bright-snow">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-grey">
              TicketHub
            </p>
            <h1 className="text-lg font-semibold text-ink-black">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-grey">Role-protected area</span>
            <DashboardLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
