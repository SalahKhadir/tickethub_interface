"use client";

import { useAuth } from "@/hooks/useAuth";

export default function HasRole({ allow, children, fallback = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return fallback;
  }

  if (!user?.role) {
    return fallback;
  }

  const roles = Array.isArray(allow) ? allow : [allow];
  const hasAccess = roles.includes(user.role);

  return hasAccess ? children : fallback;
}
