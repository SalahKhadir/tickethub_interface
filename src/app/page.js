import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-grey">
          TicketHub
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-black sm:text-5xl">
          Incident management, simplified.
        </h1>
        <p className="mt-4 text-lg text-slate-grey">
          Secure, role-based access for Admins, Technicians, and Clients.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-electric-sapphire px-6 text-sm font-semibold text-bright-snow transition hover:bg-bright-indigo"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-6 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire"
            href="/register"
          >
            Request access
          </Link>
        </div>
      </main>
    </div>
  );
}
