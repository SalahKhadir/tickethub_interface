import Link from "next/link";

export const metadata = {
  title: "Unauthorized | TicketHub",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bright-snow px-6 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-grey">
          Access blocked
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink-black">
          You do not have permission
        </h1>
        <p className="mt-3 text-sm text-slate-grey">
          Please contact an administrator or return to your workspace.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire"
            href="/dashboard"
          >
            Go to dashboard
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full bg-electric-sapphire px-5 text-sm font-semibold text-bright-snow transition hover:bg-bright-indigo"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
