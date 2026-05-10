"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AuthGate({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-grey">
          Loading session
        </p>
        <div className="mt-4 h-2 w-32 rounded-full bg-slate-grey/20" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
