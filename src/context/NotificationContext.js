"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "@/services/api";

const STORAGE_KEY = "th_seen_tickets";
const POLL_INTERVAL = 30_000;
const ENDPOINT = "/tickets/notifications?page=0&size=10";

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
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const seenRef = useRef(readSeen());

    const computeUnread = useCallback((tickets) => {
        return tickets.filter((t) => !seenRef.current.has(String(t.id))).length;
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get(ENDPOINT);
            const tickets = Array.isArray(res.data?.content)
                ? res.data.content
                : Array.isArray(res.data)
                ? res.data
                : [];
            setNotifications(tickets);
            setUnreadCount(computeUnread(tickets));
        } catch (error) {
            console.error("FULL ERROR OBJECT:", error.response?.data);
        }
    }, [computeUnread]);

    useEffect(() => {
        fetchNotifications();
        const id = setInterval(fetchNotifications, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchNotifications]);

    const markAllAsSeen = useCallback(() => {
        const updated = new Set(seenRef.current);
        notifications.forEach((t) => updated.add(String(t.id)));
        seenRef.current = updated;
        writeSeen(updated);
        setUnreadCount(0);
    }, [notifications]);

    const value = useMemo(
        () => ({ notifications, unreadCount, markAllAsSeen, refresh: fetchNotifications }),
        [notifications, unreadCount, markAllAsSeen, fetchNotifications]
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
