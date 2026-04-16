"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";

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

  const login = useCallback(async ({ user: nextUser, token }) => {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
      writeCookie(TOKEN_KEY, token);
    }

    if (nextUser) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);

      if (nextUser.role) {
        window.localStorage.setItem(ROLE_KEY, nextUser.role);
        writeCookie(ROLE_KEY, nextUser.role);
      }
    }
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
