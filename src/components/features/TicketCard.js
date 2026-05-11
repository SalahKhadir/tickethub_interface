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

    return (
        <article
            className={`relative rounded-2xl bg-white p-5 border border-gray-100 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md overflow-hidden ${breached ? "border-l-4 border-l-red-500 bg-red-50/10" : ""}`}
        >
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                            {ticket?.title || "Untitled ticket"}
                        </h3>
                        {breached ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600 tracking-wide uppercase border border-red-200 shadow-sm animate-pulse">
                                <AlertTriangle size={12} aria-hidden="true" />
                                SLA Breached
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-3xl line-clamp-2">
                        {ticket?.description || "No description provided."}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {headerRight}
                    <button
                        type="button"
                        onClick={onToggleDetails}
                        className={`h-9 px-4 rounded-xl border border-gray-200 bg-white text-xs font-bold transition-all duration-200 flex items-center gap-2 ${expanded ? 'bg-gray-100 text-gray-900 border-gray-300' : 'text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm'}`}
                    >
                        {expanded ? "Hide Details" : "View Details"}
                    </button>
                </div>
            </div>

            {children ? <div className="mt-4">{children}</div> : null}

            {expanded && details ? <div className="mt-4">{details}</div> : null}
        </article>
    );
}
