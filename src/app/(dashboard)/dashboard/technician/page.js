export const metadata = {
  title: "Technician Dashboard | TicketHub",
};

export default function TechnicianDashboardPage() {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink-black">
        Technician workspace
      </h2>
      <p className="mt-2 text-sm text-slate-grey">
        Review assigned incidents and update resolutions.
      </p>
    </section>
  );
}
