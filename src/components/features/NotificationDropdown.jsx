"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/context/NotificationContext";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

const STATUS_STYLES = {
    NEW:         "bg-blue-500 text-white",
    OPEN:        "bg-blue-500 text-white",
    ACCEPTED:    "bg-indigo-100 text-indigo-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    RESOLVED:    "bg-green-100 text-green-700",
    CLOSED:      "bg-gray-100 text-gray-500",
};

const STATUS_TEXT_BY_ROLE = {
    [ROLES.ADMIN]: {
        NEW:         "New Ticket Alert",
        OPEN:        "New Ticket Alert",
        ACCEPTED:    "Update: Ticket Assigned",
        IN_PROGRESS: "Update: Tech Started Work",
        RESOLVED:    "Ticket Resolved",
        CLOSED:      "Ticket Closed",
    },
    [ROLES.TECHNICIAN]: {
        NEW:         "New Ticket Available",
        OPEN:        "New Ticket Available",
        ACCEPTED:    "New Assignment",
        IN_PROGRESS: "In Progress",
        RESOLVED:    "Ticket Resolved",
        CLOSED:      "Ticket Closed",
    },
    [ROLES.CLIENT]: {
        NEW:         "Ticket Submitted",
        OPEN:        "Ticket Submitted",
        ACCEPTED:    "Ticket Accepted",
        IN_PROGRESS: "Being Worked On",
        RESOLVED:    "Ticket Resolved",
        CLOSED:      "Ticket Closed",
    },
};

const DOT_STYLES = {
    NEW:         "bg-blue-500",
    OPEN:        "bg-blue-500",
    ACCEPTED:    "bg-indigo-400",
    IN_PROGRESS: "bg-yellow-400",
    RESOLVED:    "bg-green-400",
    CLOSED:      "bg-gray-400",
};

const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return "";
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
};

export default function NotificationDropdown({ onClose }) {
    const router = useRouter();
    const { user } = useAuth();
    const { notifications } = useNotifications();
    const ref = useRef(null);

    const role = String(user?.role || "").toLowerCase();

    const ticketRoute = (id) => {
        if (role === ROLES.ADMIN)      return `${ROUTES.ADMIN_TICKETS}?highlight=${id}`;
        if (role === ROLES.TECHNICIAN) return `${ROUTES.TECHNICIAN_TICKETS}?highlight=${id}`;
        return `${ROUTES.CLIENT_TICKETS}?highlight=${id}`;
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute bottom-14 left-0 z-50 w-80 rounded-2xl border border-[#1F2937] bg-[#111C2D] shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notifications</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-500 hover:text-white text-xs transition"
                >
                    ✕
                </button>
            </div>

            {/* List */}
            <ul className="max-h-80 overflow-y-auto divide-y divide-[#1F2937]">
                {notifications.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-gray-500">
                        No new notifications.
                    </li>
                ) : (
                    notifications.map((ticket) => {
                        const status     = String(ticket.status || "").toUpperCase();
                        const badgeClass = STATUS_STYLES[status] || "bg-gray-100 text-gray-500";
                        const roleMap    = STATUS_TEXT_BY_ROLE[role] || STATUS_TEXT_BY_ROLE[ROLES.CLIENT];
                        const message    = roleMap[status] || "Ticket updated";
                        const date       = ticket.updatedAt || ticket.createdAt;

                        return (
                            <li key={ticket.id}>
                                <button
                                    type="button"
                                    onClick={() => { router.push(ticketRoute(ticket.id)); onClose(); }}
                                    className="w-full text-left px-4 py-3 hover:bg-[#1F2937] transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`h-2 w-2 rounded-full shrink-0 ${DOT_STYLES[status] || "bg-gray-400"}`} />
                                            <span className="text-xs font-bold text-white font-mono">
                                                TH-{ticket.id}
                                            </span>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                                            {status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-300 truncate">{message}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo(date)}</p>
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}
