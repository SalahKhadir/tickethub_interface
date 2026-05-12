"use client";

import { AlertTriangle } from "lucide-react";

const isClosedStatus = (status) => {
    const normalized = String(status || "").toUpperCase();
    return normalized === "CLOSED" || normalized === "RESOLVED";
};

const isSlaBreached = (ticket) => {
    if (!ticket?.slaDeadline || isClosedStatus(ticket?.status)) {
        return false;
    }

    const deadline = new Date(ticket.slaDeadline);
    if (Number.isNaN(deadline.getTime())) {
        return false;
    }

    return new Date() > deadline;
};

const getTicketAuthorName = (ticket) => {
    const candidateNames = [
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

    const name = candidateNames.find((value) => String(value || "").trim());
    return String(name || "").trim();
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
    const creatorInitials = (name) => {
        if (!name) return "?";
        return String(name)
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

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

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onToggleDetails}
                        className={`h-9 px-4 rounded-xl border border-gray-200 bg-white text-xs font-bold transition-all duration-200 flex items-center gap-2 ${expanded ? 'bg-gray-100 text-gray-900 border-gray-300' : 'text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm'}`}
                    >
                        {expanded ? "Hide Details" : "View Details"}
                    </button>
                </div>
            </div>
        </article>
    );
}
