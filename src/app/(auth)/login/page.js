import LoginForm from "@/components/features/LoginForm";

export const metadata = {
  title: "Sign in | TicketHub",
};

export default function LoginPage() {
  return (
    <section className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 shadow-sm">
      <h1 className="text-[22px] font-semibold text-ink-black">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-grey">
        Sign in to manage incidents with role-based access.
      </p>
      <LoginForm />
    </section>
  );
}
