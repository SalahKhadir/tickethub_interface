"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";

export default function RegisterForm() {
  const [formState, setFormState] = useState({
    nom: "",
    prenom: "",
    tel: "",
    email: "",
    password: "",
    retypePassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", formState);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to submit registration."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-grey">
          Registration submitted
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink-black">
          Registration successful!
        </h1>
        <p className="mt-2 text-sm text-slate-grey">
          Your account is awaiting administrator approval.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] border border-[rgba(17,24,39,0.10)] px-5 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire hover:bg-bright-snow"
          href="/login"
        >
          Back to sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink-black">Request access</h1>
      <p className="mt-2 text-sm text-slate-grey">
        New accounts require administrator approval before they can sign in.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Nom"
          name="nom"
          value={formState.nom}
          onChange={handleChange}
          placeholder="Doe"
          required
        />
        <Input
          label="Prenom"
          name="prenom"
          value={formState.prenom}
          onChange={handleChange}
          placeholder="Alex"
          required
        />
        <Input
          label="Telephone"
          name="tel"
          value={formState.tel}
          onChange={handleChange}
          placeholder="0712345668"
          required
        />
        <Input
          label="Email"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="alex@company.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={formState.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
        />
        <Input
          label="Retype password"
          type="password"
          name="retypePassword"
          value={formState.retypePassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          required
        />
        {error ? (
          <div className="rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]">
            {error}
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Submitting..." : "Submit request"}
        </Button>
      </form>
      <Link
        className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] border border-[rgba(17,24,39,0.10)] px-5 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire hover:bg-bright-snow"
        href="/login"
      >
        Back to sign in
      </Link>
    </section>
  );
}
