"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "@/services/api";

export const AuthContext = createContext(null);

const TOKEN_KEY = "th_token";
const USER_KEY = "th_user";
const ROLE_KEY = "th_role";

const readCookie = (name) => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (name, value) => {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax`;
};

const clearCookie = (name) => {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

const normalizeRole = (value) => {
  if (!value) {
    return null;
  }
  let normalized = String(value).toLowerCase();
  while (normalized.startsWith("role_")) {
    normalized = normalized.slice("role_".length);
  }
  return normalized;
};

const readRoleFromToken = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }
  const roleClaim =
    decoded.role ||
    decoded.roles?.[0] ||
    decoded.authorities?.[0] ||
    decoded["custom:role"];
  return normalizeRole(roleClaim);
};

const readUsernameFromToken = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }
  return decoded.username || decoded.sub || decoded.email || null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = window.localStorage.getItem(USER_KEY);
    const storedToken =
      window.localStorage.getItem(TOKEN_KEY) || readCookie(TOKEN_KEY);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        window.localStorage.removeItem(USER_KEY);
      }
    }

    if (storedToken && !storedUser) {
      setUser({ role: readCookie(ROLE_KEY) || "unknown" });
    }

    setLoading(false);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, accessToken } = response.data || {};
    const resolvedToken = token || accessToken;

    if (!resolvedToken) {
      throw new Error("Missing token in login response.");
    }

    const decoded = jwtDecode(resolvedToken);
    const role = readRoleFromToken(decoded) || "client";
    const username = readUsernameFromToken(decoded) || email;
    const nextUser = { username, role };

    window.localStorage.setItem(TOKEN_KEY, resolvedToken);
    writeCookie(TOKEN_KEY, resolvedToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    window.localStorage.setItem(ROLE_KEY, role);
    writeCookie(ROLE_KEY, role);
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(ROLE_KEY);
    clearCookie(TOKEN_KEY);
    clearCookie(ROLE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
