import Link from "next/link";

export const metadata = {
  title: "Request access | TicketHub",
};

export default function RegisterPage() {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink-black">Request access</h1>
      <p className="mt-2 text-sm text-slate-grey">
        Access requests are provisioned by your organization admin.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-black/10 bg-bright-snow px-4 py-6 text-sm text-slate-grey">
        Provide a request form here or link to your HR/IT workflow.
      </div>
      <Link
        className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire"
        href="/login"
      >
        Back to sign in
      </Link>
    </section>
  );
}
