export const metadata = {
  title: "Client Dashboard | TicketHub",
};

export default function ClientDashboardPage() {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink-black">Client portal</h2>
      <p className="mt-2 text-sm text-slate-grey">
        Track your incidents and service requests in one place.
      </p>
    </section>
  );
}
