import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  withCredentials: true,
});

const readCookie = (name) => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("th_token") || readCookie("th_token");
};

const clearLocalSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("th_token");
  window.localStorage.removeItem("th_user");
  window.localStorage.removeItem("th_role");
  document.cookie = "th_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "th_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearLocalSession();
    }
    return Promise.reject(error);
  }
);

export default api;
