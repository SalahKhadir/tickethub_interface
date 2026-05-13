"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState({ message: "", type: "error" });
  const [loading, setLoading] = useState(false);

  const pendingParam = searchParams.get("pending") === "1";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError({ message: "", type: "error" });
    setLoading(true);

    try {
      const user = await login(formState);
      const redirectTarget = searchParams.get("redirect");
      if (redirectTarget) {
        router.replace(redirectTarget);
        return;
      }

      const role = user?.role;
      if (role === ROLES.ADMIN) {
        router.replace(ROUTES.ADMIN);
      } else if (role === ROLES.TECHNICIAN || role === "tech") {
        router.replace(ROUTES.TECHNICIAN);
      } else {
        router.replace(ROUTES.CLIENT);
      }
    } catch (err) {
      const message =
        err?.message || "Unable to sign in. Check your credentials.";
      const isWarning = message
        .toLowerCase()
        .includes("awaiting administrator approval");
      setError({ message, type: isWarning ? "warning" : "error" });
    } finally {
      setLoading(false);
    }
  };

  const DEV_ACCOUNTS = [
    { label: "Client", email: "lilsall.kh@gmail.com", password: "AnaClient123" },
    { label: "Tech", email: "salaho.khadir@gmail.com", password: "AnaTech123" },
    { label: "Admin", email: "salah.khadir@outlook.com", password: "AnaAdmin123" },
  ];

  const fillDevAccount = (account) => {
    setFormState({ email: account.email, password: account.password });
    setError({ message: "", type: "error" });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input
        label="Email"
        type="email"
        name="email"
        value={formState.email}
        onChange={handleChange}
        placeholder="you@company.com"
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        value={formState.password}
        onChange={handleChange}
        placeholder="Enter your password"
        required
      />
      {pendingParam ? (
        <div className="rounded-[10px] border border-[rgba(245,158,11,0.25)] bg-[#FEF3C7] px-4 py-3 text-sm text-[#D97706]">
          Your account is awaiting administrator approval.
        </div>
      ) : null}
      {error.message ? (
        <div
          className={`rounded-[10px] border px-4 py-3 text-sm ${error.type === "warning"
              ? "border-[rgba(245,158,11,0.25)] bg-[#FEF3C7] text-[#D97706]"
              : "border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] text-[#991B1B]"
            }`}
        >
          {error.message}
        </div>
      ) : null}
      {/* DEV ONLY — remove before production */}
      <div className="rounded-[10px] border border-dashed border-amber-300 bg-amber-50 p-3 space-y-2">
        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Dev quick-login</p>
        <div className="flex gap-2">
          {DEV_ACCOUNTS.map((acc) => (
            <button
              key={acc.label}
              type="button"
              onClick={() => fillDevAccount(acc)}
              className="flex-1 rounded-lg border border-amber-200 bg-white py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
