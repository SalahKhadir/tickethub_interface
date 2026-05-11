"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "@/services/api";

export const AuthContext = createContext(null);

const TOKEN_KEY = "th_token";
const USER_KEY = "th_user";
const ROLE_KEY = "th_role";
const ENABLED_KEY = "th_enabled";

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
  if (normalized === "tech") {
    return "technician";
  }
  return normalized;
};

const readRoleFromToken = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }
  return normalizeRole(decoded.role);
};

const readUsernameFromToken = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }
  return decoded.username || decoded.sub || decoded.email || null;
};

const readEnabledFromToken = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }
  if (typeof decoded.enabled === "boolean") {
    return decoded.enabled;
  }
  if (typeof decoded.enabled === "string") {
    return decoded.enabled.toLowerCase() === "true";
  }
  return null;
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
      setUser({
        role: readCookie(ROLE_KEY) || "unknown",
        enabled: readCookie(ENABLED_KEY) !== "false",
      });
    }

    setLoading(false);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, accessToken, enabled: enabledFromResponse } =
        response.data || {};
      const resolvedToken = token || accessToken;

      if (!resolvedToken) {
        throw new Error("Missing token in login response.");
      }

      const decoded = jwtDecode(resolvedToken);
      const roleFromToken = readRoleFromToken(decoded);
      if (!roleFromToken) {
        console.warn("Role claim missing in JWT; defaulting to client.");
      }
      const role = roleFromToken || "client";
      const username = readUsernameFromToken(decoded) || email;
      const enabledFromToken = readEnabledFromToken(decoded);
      const enabled =
        typeof enabledFromResponse === "boolean"
          ? enabledFromResponse
          : enabledFromToken ?? true;
      const nextUser = { username, role, enabled };

      window.localStorage.setItem(TOKEN_KEY, resolvedToken);
      writeCookie(TOKEN_KEY, resolvedToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      window.localStorage.setItem(ROLE_KEY, role);
      writeCookie(ROLE_KEY, role);
      window.localStorage.setItem(ENABLED_KEY, String(enabled));
      writeCookie(ENABLED_KEY, String(enabled));
      setUser(nextUser);

      return nextUser;
    } catch (error) {
      const status = error?.response?.status;
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "";
      const normalizedMessage = String(backendMessage).toLowerCase();

      if ((status === 401 || status === 403) && normalizedMessage) {
        if (normalizedMessage.includes("disabled")) {
          throw new Error(
            "Your account is awaiting administrator approval."
          );
        }
      }

      if (status === 401) {
        throw new Error("Invalid email or password.");
      }
      if (status === 403) {
        throw new Error("Your account is disabled.");
      }
      if (!error?.response) {
        throw new Error("Server is unreachable. Check your connection.");
      }
      throw new Error("An unexpected error occurred.");
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(ROLE_KEY);
    window.localStorage.removeItem(ENABLED_KEY);
    clearCookie(TOKEN_KEY);
    clearCookie(ROLE_KEY);
    clearCookie(ENABLED_KEY);
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
