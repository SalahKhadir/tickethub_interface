"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "th_seen_tickets";
const SSE_BASE = "http://localhost:8080";
const SSE_PATH = `${SSE_BASE}/api/notifications/subscribe`;

const readSeen = () => {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
        return new Set();
    }
};

const writeSeen = (ids) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const seenRef   = useRef(readSeen());
    const esRef      = useRef(null);
    const retryRef      = useRef(null);
    const retryCountRef = useRef(0);
    const pingRef       = useRef(null);
    const MAX_RETRIES   = 5;

    const openSSE = useCallback(() => {
        if (esRef.current) {
            esRef.current.close();
        }

        const token = typeof window !== "undefined"
            ? localStorage.getItem("th_token")
            : null;

        if (!token) return;

        const fullUrl = `${SSE_PATH}?token=${encodeURIComponent(token)}`;
        console.log("Connecting to SSE at:", fullUrl);
        const es  = new EventSource(fullUrl);
        esRef.current = es;

        es.addEventListener("heartbeat", () => {
            console.log("Pulse received");
        });

        es.addEventListener("connected", () => {
            console.log("SSE connected — stream open");
            retryCountRef.current = 0;
        });

        const handleTicket = (event) => {
            console.log("Raw SSE Data received:", event.data);
            try {
                const newTicket = JSON.parse(event.data);
                if (!newTicket?.id) return;

                setNotifications((prev) => {
                    const isDuplicate = prev.some((t) => t.id === newTicket.id);
                    if (isDuplicate) return prev;

                    // Side effects deferred to after this render cycle
                    setTimeout(() => {
                        if (!seenRef.current.has(String(newTicket.id))) {
                            setUnreadCount((c) => c + 1);
                            toast.success(`New Ticket: ${newTicket.title || `TH-${newTicket.id}`}`, {
                                duration: 4000,
                                style: {
                                    background: "#111C2D",
                                    color: "#fff",
                                    fontSize: "13px",
                                    borderRadius: "12px",
                                    border: "1px solid #1F2937",
                                },
                            });
                        }
                    }, 0);

                    return [newTicket, ...prev];
                });
            } catch (err) {
                console.error("SSE Parse Error:", err);
            }
        };

        // Use ONLY addEventListener — es.onmessage + addEventListener("message") both fire
        // for the same unnamed event, causing the double-count bug
        es.addEventListener("message",       handleTicket);
        es.addEventListener("ticket-update", handleTicket);

        es.onerror = () => {
            console.log("SSE EventSource State:", es.readyState);
            es.close();
            esRef.current = null;
            retryCountRef.current += 1;
            if (retryCountRef.current > MAX_RETRIES) {
                console.warn(`SSE: max retries (${MAX_RETRIES}) reached. Giving up until next login.`);
                return;
            }
            const delay = retryCountRef.current === 1 ? 3_000 : Math.min(5_000 * retryCountRef.current, 30_000);
            console.warn(`SSE connection error — retrying in ${delay / 1000}s… (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            retryRef.current = setTimeout(openSSE, delay);
        };
    }, []);

    // Open SSE when authenticated, close when logged out
    useEffect(() => {
        if (isAuthenticated) {
            retryCountRef.current = 0;
            openSSE();
            pingRef.current = setInterval(() => {
                if (esRef.current?.readyState === EventSource.CLOSED) {
                    console.warn("SSE watchdog: connection closed — reconnecting…");
                    retryCountRef.current = 0;
                    openSSE();
                }
            }, 15_000);

            const handleVisibility = () => {
                if (document.visibilityState === "visible") {
                    const state = esRef.current?.readyState;
                    if (state === undefined || state === EventSource.CLOSED) {
                        console.log("Tab refocused — SSE closed, reconnecting…");
                        retryCountRef.current = 0;
                        openSSE();
                    }
                }
            };
            document.addEventListener("visibilitychange", handleVisibility);

            return () => {
                clearTimeout(retryRef.current);
                clearInterval(pingRef.current);
                document.removeEventListener("visibilitychange", handleVisibility);
                esRef.current?.close();
                esRef.current = null;
            };
        } else {
            clearTimeout(retryRef.current);
            clearInterval(pingRef.current);
            esRef.current?.close();
            esRef.current = null;
            // Clear seen cache so next login starts with a fresh unread count
            seenRef.current = new Set();
            localStorage.removeItem(STORAGE_KEY);
            setNotifications([]);
            setUnreadCount(0);
        }

        return () => {
            clearTimeout(retryRef.current);
            clearInterval(pingRef.current);
            esRef.current?.close();
            esRef.current = null;
        };
    }, [isAuthenticated, openSSE]);

    const markAllAsSeen = useCallback(() => {
        const updated = new Set(seenRef.current);
        notifications.forEach((t) => updated.add(String(t.id)));
        seenRef.current = updated;
        writeSeen(updated);
        setUnreadCount(0);
    }, [notifications]);

    const value = useMemo(
        () => ({ notifications, unreadCount, markAllAsSeen }),
        [notifications, unreadCount, markAllAsSeen]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
    return ctx;
};
