"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";

const URGENT_MS = 15 * 60 * 1000; // 15 minutes

const isClosedStatus = (status) => {
    const s = String(status || "").toUpperCase();
    return s === "CLOSED" || s === "RESOLVED";
};

const isSlaBreached = (ticket) => {
    if (!ticket?.slaDeadline || isClosedStatus(ticket?.status)) return false;
    const d = new Date(ticket.slaDeadline);
    return !Number.isNaN(d.getTime()) && new Date() > d;
};

// Returns a human-readable countdown string and urgency flag
const computeCountdown = (deadline) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { label: "Overdue", urgent: true, overdue: true };
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    const label = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
    return { label, urgent: diff < URGENT_MS, overdue: false };
};

function SlaCountdown({ deadline, status }) {
    const [tick, setTick] = useState(() => computeCountdown(deadline));

    useEffect(() => {
        if (isClosedStatus(status)) return;
        const id = setInterval(() => setTick(computeCountdown(deadline)), 1_000);
        return () => clearInterval(id);
    }, [deadline, status]);

    if (isClosedStatus(status)) return null;

    const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border";
    const style = tick.overdue
        ? `${base} bg-red-100 text-red-600 border-red-200 animate-pulse`
        : tick.urgent
        ? `${base} bg-orange-100 text-orange-600 border-orange-200 animate-pulse`
        : `${base} bg-gray-100 text-gray-600 border-gray-200`;

    return (
        <span className={style}>
            <Clock size={11} aria-hidden="true" />
            {tick.label}
        </span>
    );
}

const getTicketAuthorName = (ticket) => {
    const candidates = [
        ticket?.authorName,
        ticket?.creatorName,
        ticket?.author_name,
        ticket?.createdByName,
        ticket?.createdBy?.name,
        ticket?.createdBy?.fullName,
        ticket?.author?.name,
        ticket?.author?.fullName,
        ticket?.clientName,
    ];
    const name = candidates.find((v) => String(v || "").trim());
    return String(name || "").trim();
};

const creatorInitials = (name) => {
    if (!name) return "?";
    return String(name).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function TicketCard({
    ticket,
    expanded,
    onToggleDetails,
    headerRight,
    details,
    children,
}) {
    const breached = isSlaBreached(ticket);
    const p = (ticket?.priority || "LOW").toUpperCase();
    let borderClass = "border-blue-400";
    if (p === "CRITICAL" || p === "URGENT") borderClass = "border-red-400";
    else if (p === "HIGH") borderClass = "border-orange-400";
    else if (p === "MEDIUM") borderClass = "border-yellow-400";

    const authorName = getTicketAuthorName(ticket);
    const authorLabel = authorName || ticket?.authorEmail || "System";
    const authorSubtext = authorName && ticket?.authorEmail ? ticket.authorEmail : "";

    const showCountdown =
        ticket?.slaDeadline &&
        !isClosedStatus(ticket?.status) &&
        !Number.isNaN(new Date(ticket.slaDeadline).getTime());

    return (
        <article className={`bg-white rounded-2xl border p-4 shadow-sm mb-3 flex flex-col h-full ${borderClass} ${breached ? "critical-card bg-[#FFF5F5]" : ""}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                            {ticket?.title || "Untitled ticket"}
                        </h3>
                        {breached ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600 tracking-wide uppercase border border-red-200 shadow-sm animate-pulse">
                                <AlertTriangle size={12} aria-hidden="true" />
                                SLA Breached
                            </span>
                        ) : showCountdown ? (
                            <SlaCountdown deadline={ticket.slaDeadline} status={ticket.status} />
                        ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {ticket?.description || "No description provided."}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {headerRight}
                </div>
            </div>

            {children ? <div className="mt-4">{children}</div> : null}

            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                        {creatorInitials(authorName || authorLabel)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-gray-700 text-sm truncate">{authorLabel}</p>
                        {authorSubtext ? (
                            <p className="text-gray-400 text-xs truncate">{authorSubtext}</p>
                        ) : null}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onToggleDetails}
                    className={`h-9 px-4 rounded-xl border border-gray-200 bg-white text-xs font-bold transition-all duration-200 flex items-center gap-2 ${expanded ? "bg-gray-100 text-gray-900 border-gray-300" : "text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm"}`}
                >
                    {expanded ? "Hide Details" : "View Details"}
                </button>
            </div>

            {expanded && details ? <div className="mt-4">{details}</div> : null}
        </article>
    );
}
