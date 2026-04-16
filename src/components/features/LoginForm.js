"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

export default function LoginForm() {
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formState);
      const { user, token } = response.data;
      await login({ user, token });
    } catch (err) {
      setError("Unable to sign in. Check your credentials.");
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
      {error ? <p className="text-sm text-strawberry-red">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
