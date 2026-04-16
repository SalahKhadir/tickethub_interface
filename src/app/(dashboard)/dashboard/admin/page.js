export const metadata = {
  title: "Admin Dashboard | TicketHub",
};

export default function AdminDashboardPage() {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink-black">Admin overview</h2>
      <p className="mt-2 text-sm text-slate-grey">
        Manage users, RBAC policies, and incident escalation.
      </p>
    </section>
  );
}
