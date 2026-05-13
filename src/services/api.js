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
  const { page, status, priority, category } = params;
  const queryParams = {};

  if (page !== undefined && page !== null)                    queryParams.page     = page;
  if (status   && status   !== "")                            queryParams.status   = status;
  if (priority && priority !== "")                            queryParams.priority = priority;
  if (category && category !== "")                            queryParams.category = category;

  return fetchAPI("/api/tickets", { method: "GET", params: queryParams });
};

export const updateTicketStatus = (id, newStatus, extraData = {}) => {
  const sanitizedExtraData = {};
  if (typeof extraData?.solution === "string") {
    sanitizedExtraData.solution = extraData.solution;
  }
  if (extraData?.techId !== undefined && extraData?.techId !== null) {
    const numericTechId = Number(extraData.techId);
    if (!Number.isNaN(numericTechId)) {
      sanitizedExtraData.techId = numericTechId;
    }
  }

  return fetchAPI(`/api/tickets/${id}/status`, {
    method: "PATCH",
    data: {
      newStatus,
      ...sanitizedExtraData,
    },
  });
};

const toArrayPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.content)) {
    return payload.content;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.users)) {
    return payload.users;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  return [];
};

const isTechnicianRecord = (user) => {
  const rawRole = user?.role || user?.userRole || user?.type || user?.profile;
  const normalizedRole = String(rawRole || "").toLowerCase();
  return normalizedRole.includes("technician") || normalizedRole.includes("tech");
};

const mapTechnicianRecord = (user = {}) => {
  const id =
    user?.id || user?.userId || user?.technicianId || user?.uuid || user?.identifier;
  const label =
    user?.fullName ||
    [user?.prenom, user?.nom].filter(Boolean).join(" ") ||
    user?.name ||
    user?.username ||
    user?.email ||
    (id ? `Technician ${id}` : "Technician");

  return { ...user, id, fullName: label };
};

export const getTechnicians = async () => {
  const payload = await fetchAPI("/api/technicians", { method: "GET" });
  return toArrayPayload(payload).map(mapTechnicianRecord);
};

export const assignTicket = async (id, technicianId) => {
  const ticketId = Number(id);
  const techId = Number(technicianId);

  if (Number.isNaN(ticketId)) {
    throw new Error("Invalid ticket id.");
  }
  if (Number.isNaN(techId)) {
    throw new Error("Invalid technician id.");
  }

  const payload = { techId };

  return fetchAPI(`/api/tickets/${ticketId}/assign`, {
    method: "PATCH",
    data: payload,
  });
};

export const getTechnicianAvailability = async () => {
  const payload = await fetchAPI("/api/technicians/availability", { method: "GET" });
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload?.data)
    ? payload.data
    : [];
  // Normalise to Map<id, activeTicketsCount> — handles both old and new DTO shapes
  return list.reduce((acc, entry) => {
    const id    = entry?.id ?? entry?.technicianId ?? entry?.userId;
    const count = entry?.activeTicketsCount ?? entry?.activeTickets ?? entry?.activeTicketCount ?? entry?.count ?? 0;
    if (id !== undefined && id !== null) {
      acc[String(id)] = Number(count);
    }
    return acc;
  }, {});
};

export const resolveTicket = (id, solution) => {
  return fetchAPI(`/api/tickets/${id}/status`, {
    method: "PATCH",
    data: {
      newStatus: "RESOLVED",
      solution,
    },
  });
};

export default api;
