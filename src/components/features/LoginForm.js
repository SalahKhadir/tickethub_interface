"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
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
      if (role === "admin") {
        router.replace(ROUTES.ADMIN);
      } else if (role === "technician") {
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
        <div className="rounded-xl border border-golden-orange/30 bg-golden-orange/10 px-4 py-3 text-sm text-golden-orange">
          Your account is awaiting administrator approval.
        </div>
      ) : null}
      {error.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error.type === "warning"
              ? "border-golden-orange/30 bg-golden-orange/10 text-golden-orange"
              : "border-strawberry-red/30 bg-strawberry-red/10 text-strawberry-red"
          }`}
        >
          {error.message}
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
