"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/services/api";

const normalizeApiPath = (path) => {
  if (typeof path !== "string") {
    return path;
  }
  if (path.startsWith("/api/")) {
    return path.replace(/^\/api/, "");
  }
  return path;
};

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { fallbackUrls = [], ...requestOptions } = options;

  // Keep option dependencies stable between renders when values did not change.
  const stableRequestOptions = useMemo(
    () => requestOptions,
    [JSON.stringify(requestOptions)]
  );
  const stableFallbackUrls = useMemo(
    () => fallbackUrls,
    [JSON.stringify(fallbackUrls)]
  );

  const fetchData = useCallback(async () => {
    if (!url) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const candidates = [url, ...stableFallbackUrls].filter(Boolean);
      let response = null;
      let lastError = null;

      for (const candidate of candidates) {
        try {
          response = await api.get(normalizeApiPath(candidate), stableRequestOptions);
          break;
        } catch (candidateError) {
          lastError = candidateError;
          const status = candidateError?.response?.status;
          if (status !== 403 && status !== 404) {
            break;
          }
        }
      }

      if (!response) {
        throw lastError || new Error("Unable to load data.");
      }

      setData(response.data);
    } catch (err) {
      if (!err?.response) {
        setError("API server unreachable. Verify backend is running and API URL is correct.");
        return;
      }

      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.error || "";
      setError(backendMessage || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [url, stableRequestOptions, stableFallbackUrls]);

  useEffect(() => {
    let active = true;

    if (active) {
      fetchData();
    }

    return () => {
      active = false;
    };
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}
