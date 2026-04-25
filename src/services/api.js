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

const normalizeApiPath = (path) => {
  if (typeof path !== "string") {
    return path;
  }
  if (path.startsWith("/api/")) {
    return path.replace(/^\/api/, "");
  }
  return path;
};

export const fetchAPI = async (path, options = {}) => {
  const { method = "GET", data, params, ...restOptions } = options;
  const response = await api({
    url: normalizeApiPath(path),
    method,
    data,
    params,
    ...restOptions,
  });
  return response.data;
};

const normalizeTicketPayload = (data = {}) => {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const priority =
    typeof data.priority === "string" ? data.priority.trim().toUpperCase() : "";
  const category =
    typeof data.category === "string" ? data.category.trim().toUpperCase() : "";

  return {
    title,
    description,
    priority,
    category,
  };
};

export const createTicket = (data) => {
  const payload = normalizeTicketPayload(data);

  if (!payload.title || !payload.description) {
    throw new Error("Title and description are required to create a ticket.");
  }

  return fetchAPI("/api/tickets", {
    method: "POST",
    data: payload,
  });
};

export const getTickets = (params = {}) => {
  const { page, status, priority } = params;
  const queryParams = {};

  if (page !== undefined && page !== null) {
    queryParams.page = page;
  }
  if (status !== undefined && status !== null && status !== "") {
    queryParams.status = status;
  }
  if (priority !== undefined && priority !== null && priority !== "") {
    queryParams.priority = priority;
  }

  return fetchAPI("/api/tickets", {
    method: "GET",
    params: queryParams,
  });
};

export const updateTicketStatus = (id, newStatus) => {
  return fetchAPI(`/api/tickets/${id}/status`, {
    method: "PATCH",
    data: { newStatus },
  });
};

export default api;
