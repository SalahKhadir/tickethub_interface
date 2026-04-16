"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!url) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(url, options);
      setData(response.data);
    } catch (err) {
      setError("Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [url, options]);

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
