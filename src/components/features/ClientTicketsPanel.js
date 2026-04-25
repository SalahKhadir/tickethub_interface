"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { getTickets } from "@/services/api";

const STATUS_OPTIONS = ["", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_BADGE_CLASSES = {
    OPEN: "border-amber-300/70 bg-amber-100 text-amber-900",
    IN_PROGRESS: "border-blue-300/70 bg-blue-100 text-blue-900",
    RESOLVED: "border-emerald-300/70 bg-emerald-100 text-emerald-900",
    CLOSED: "border-slate-300/70 bg-slate-200 text-slate-900",
    NEW: "border-violet-300/70 bg-violet-100 text-violet-900",
};

const PRIORITY_BADGE_CLASSES = {
    LOW: "border-emerald-300/70 bg-emerald-100 text-emerald-900",
    MEDIUM: "border-yellow-300/70 bg-yellow-100 text-yellow-900",
    HIGH: "border-orange-300/70 bg-orange-100 text-orange-900",
    URGENT: "border-red-300/70 bg-red-100 text-red-900",
};

const formatDate = (value) => {
    if (!value) {
        return "N/A";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleString();
};

const getBadgeClasses = (value, classesMap) => {
    const normalizedValue = String(value || "").toUpperCase();
    return (
        classesMap[normalizedValue] ||
        "border-black/15 bg-white text-slate-grey"
    );
};

export default function ClientTicketsPanel() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const pageData = await getTickets({
                page: currentPage,
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
            });

            setTickets(Array.isArray(pageData?.content) ? pageData.content : []);
            setCurrentPage(typeof pageData?.number === "number" ? pageData.number : 0);
            setTotalPages(
                typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
            );
        } catch (err) {
            const backendMessage =
                err?.response?.data?.message || err?.response?.data?.error || "";
            setError(backendMessage || "Unable to load recent tickets.");
            setTickets([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, priorityFilter, statusFilter]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const hasPrevious = currentPage > 0;
    const hasNext = totalPages > 0 && currentPage + 1 < totalPages;

    const handlePriorityChange = (event) => {
        setCurrentPage(0);
        setPriorityFilter(event.target.value);
    };

    const handleStatusChange = (event) => {
        setCurrentPage(0);
        setStatusFilter(event.target.value);
    };

    const displayedTickets = tickets.filter((ticket) => {
        if (!searchTerm.trim()) {
            return true;
        }
        const keyword = searchTerm.toLowerCase();
        const title = String(ticket?.title || "").toLowerCase();
        const description = String(ticket?.description || "").toLowerCase();
        return title.includes(keyword) || description.includes(keyword);
    });

    return (
        <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-grey">
                        Ticket follow-up
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-ink-black">Recent tickets</h2>
                    <p className="mt-2 text-sm text-slate-grey">
                        View your recent tickets with color-coded status and priority.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={ROUTES.CLIENT}
                        prefetch={false}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire"
                    >
                        Back to dashboard
                    </Link>
                    <Link
                        href={ROUTES.CLIENT_NEW_TICKET}
                        prefetch={false}
                        className="inline-flex h-10 items-center justify-center rounded-full bg-electric-sapphire px-4 text-sm font-semibold text-bright-snow transition hover:bg-bright-indigo"
                    >
                        Create ticket
                    </Link>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status || "ALL_STATUS"} value={status}>
                                {status || "All statuses"}
                            </option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={handlePriorityChange}
                        className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
                    >
                        {PRIORITY_OPTIONS.map((priority) => (
                            <option key={priority || "ALL_PRIORITY"} value={priority}>
                                {priority || "All priorities"}
                            </option>
                        ))}
                    </select>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by title"
                        className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-ink-black placeholder:text-slate-grey focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
                    />
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-10 px-4"
                    onClick={loadTickets}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </div>

            {error ? (
                <div className="mt-4 rounded-xl border border-strawberry-red/30 bg-strawberry-red/10 px-4 py-3 text-sm text-strawberry-red">
                    {error}
                </div>
            ) : null}

            <div className="mt-5 space-y-3">
                {loading ? (
                    <p className="text-sm text-slate-grey">Loading tickets...</p>
                ) : displayedTickets.length === 0 ? (
                    <p className="text-sm text-slate-grey">No tickets found.</p>
                ) : (
                    displayedTickets.map((ticket) => (
                        <article key={ticket.id} className="rounded-xl border border-black/10 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-ink-black">
                                        {ticket.title || "Untitled ticket"}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-grey">
                                        {ticket.description || "No description provided."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="h-8 rounded-full border border-black/15 px-3 text-xs font-semibold text-ink-black transition hover:border-electric-sapphire"
                                    onClick={() =>
                                        setExpandedTicketId((prev) => (prev === ticket.id ? null : ticket.id))
                                    }
                                >
                                    {expandedTicketId === ticket.id ? "Hide details" : "Details"}
                                </button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                                <span
                                    className={`rounded-full border px-3 py-1 ${getBadgeClasses(
                                        ticket.status,
                                        STATUS_BADGE_CLASSES
                                    )}`}
                                >
                                    Status: {ticket.status || "N/A"}
                                </span>
                                <span
                                    className={`rounded-full border px-3 py-1 ${getBadgeClasses(
                                        ticket.priority,
                                        PRIORITY_BADGE_CLASSES
                                    )}`}
                                >
                                    Priority: {ticket.priority || "N/A"}
                                </span>
                                <span className="rounded-full border border-black/15 bg-white px-3 py-1 text-slate-grey">
                                    Category: {ticket.category || "N/A"}
                                </span>
                            </div>

                            {expandedTicketId === ticket.id ? (
                                <div className="mt-4 grid gap-2 rounded-xl border border-black/10 bg-smoke-silver/40 p-4 text-sm text-ink-black md:grid-cols-2">
                                    <p>
                                        <span className="font-semibold">Ticket ID:</span> {ticket.id || "N/A"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Created:</span> {formatDate(ticket.createdAt)}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Updated:</span> {formatDate(ticket.updatedAt)}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Assignee:</span> {ticket.assigneeName || "N/A"}
                                    </p>
                                </div>
                            ) : null}
                        </article>
                    ))
                )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasPrevious || loading}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                >
                    Previous
                </Button>

                <p className="text-sm text-slate-grey">
                    Page {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
                </p>

                <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasNext || loading}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                    Next
                </Button>
            </div>
        </section>
    );
}
