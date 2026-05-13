"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { getTickets, fetchAPI } from "@/services/api";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_OPTIONS = ["", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

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

const getCardBorderClass = (priority) => {
    const p = (priority || "LOW").toUpperCase();
    if (p === "CRITICAL" || p === "URGENT") return "border-red-400";
    if (p === "HIGH") return "border-orange-400";
    if (p === "MEDIUM") return "border-yellow-400";
    return "border-blue-400";
};

export default function ClientTicketsPanel() {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    const pageParam     = Number(searchParams.get("page")     || "0");
    const statusParam   = searchParams.get("status")   || "";
    const priorityParam = searchParams.get("priority") || "";
    const keywordParam  = searchParams.get("keyword")  || "";

    const pushParams = useCallback((updates) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v) params.set(k, v); else params.delete(k);
        });
        params.set("page", "0");
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    const setPage = useCallback((p) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const [deletingTicketId, setDeletingTicketId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", description: "", priority: "" });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const pageData = await getTickets({
                page: pageParam,
                status:   statusParam   || undefined,
                priority: priorityParam || undefined,
                keyword:  keywordParam  || undefined,
            });

            setTickets(Array.isArray(pageData?.content) ? pageData.content : []);
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
    }, [pageParam, priorityParam, statusParam, keywordParam]);
    
    const handleDeleteTicket = async (ticketId) => {
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await fetchAPI(`/api/tickets/${ticketId}`, { method: "DELETE" });
            setDeletingTicketId(null);
            loadTickets();
        } catch (err) {
            setDeleteError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to delete ticket. Please try again."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditSubmit = async (ticketId) => {
        if (!editForm.title.trim()) {
            setEditError("Title cannot be empty.");
            return;
        }
        if (!editForm.description.trim()) {
            setEditError("Description cannot be empty.");
            return;
        }
        setEditLoading(true);
        setEditError("");
        try {
            await fetchAPI(`/api/tickets/${ticketId}`, {
                method: "PATCH",
                data: {
                    title: editForm.title.trim(),
                    description: editForm.description.trim(),
                    priority: editForm.priority,
                },
            });
            setEditingTicketId(null);
            loadTickets();
        } catch (err) {
            setEditError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to update ticket."
            );
        } finally {
            setEditLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const hasPrevious = pageParam > 0;
    const hasNext = totalPages > 0 && pageParam + 1 < totalPages;

    return (
        <section className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 shadow-sm">
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
                        className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[rgba(17,24,39,0.10)] bg-white px-4 text-sm font-semibold text-ink-black transition-all duration-200 hover:border-electric-sapphire hover:bg-bright-snow hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
                    >
                        Back to dashboard
                    </Link>
                    <Link
                        href={ROUTES.CLIENT_NEW_TICKET}
                        prefetch={false}
                        className="inline-flex h-10 items-center justify-center rounded-[10px] bg-electric-sapphire px-4 text-sm font-semibold text-bright-snow transition-all duration-200 hover:bg-bright-indigo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    >
                        Create ticket
                    </Link>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="search"
                        value={keywordParam}
                        onChange={(e) => pushParams({ keyword: e.target.value })}
                        placeholder="Search tickets…"
                        className="h-10 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-3 text-sm text-ink-black placeholder:text-slate-grey focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] w-48"
                    />
                    <select
                        value={statusParam}
                        onChange={(e) => pushParams({ status: e.target.value })}
                        className="h-10 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-3 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status || "ALL_STATUS"} value={status}>
                                {status || "All statuses"}
                            </option>
                        ))}
                    </select>
                    <select
                        value={priorityParam}
                        onChange={(e) => pushParams({ priority: e.target.value })}
                        className="h-10 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-3 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                    >
                        {PRIORITY_OPTIONS.map((priority) => (
                            <option key={priority || "ALL_PRIORITY"} value={priority}>
                                {priority || "All priorities"}
                            </option>
                        ))}
                    </select>

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
                <div className="mt-4 rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]">
                    {error}
                </div>
            ) : null}

            <div className="mt-5 space-y-3">
                {loading ? (
                    <p className="text-sm text-slate-grey">Loading tickets...</p>
                ) : tickets.length === 0 ? (
                    <p className="text-sm text-slate-grey">No tickets found.</p>
                ) : (
                    tickets.map((ticket) => (
                        <article key={ticket.id} className={`rounded-[14px] border bg-white p-4 transition hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)] ${getCardBorderClass(ticket.priority)}`}>
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
                                    className="h-8 rounded-xl bg-blue-600 px-4 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                                    onClick={() =>
                                        setExpandedTicketId((prev) => (prev === ticket.id ? null : ticket.id))
                                    }
                                >
                                    {expandedTicketId === ticket.id ? "Hide details" : "View Details"}
                                </button>
                                {ticket.status === "NEW" && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingTicketId(ticket.id);
                                                setEditForm({
                                                    title: ticket.title,
                                                    description: ticket.description,
                                                    priority: ticket.priority,
                                                });
                                                setEditError("");
                                            }}
                                            className="text-gray-300 hover:text-blue-500 transition p-1 rounded-lg hover:bg-blue-50"
                                            title="Edit ticket"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeletingTicketId(ticket.id)}
                                            className="text-gray-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50"
                                            title="Delete ticket"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <span className="rounded-full border border-[rgba(17,24,39,0.10)] bg-white px-3 py-1 text-slate-grey h-[26px] inline-flex items-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md hover:bg-gray-50 cursor-default">
                                    Category: {ticket.category || "N/A"}
                                </span>
                            </div>

                            {deletingTicketId === ticket.id && (
                                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between">
                                    <p className="text-red-600 text-sm font-medium">
                                        Are you sure you want to delete this ticket? This cannot be undone.
                                    </p>
                                    <div className="flex items-center gap-2 ml-4 shrink-0">
                                        <button
                                            onClick={() => handleDeleteTicket(ticket.id)}
                                            disabled={deleteLoading}
                                            className="bg-red-500 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition"
                                        >
                                            {deleteLoading ? "Deleting..." : "Yes, delete"}
                                        </button>
                                        <button
                                            onClick={() => { setDeletingTicketId(null); setDeleteError(""); }}
                                            className="border border-gray-200 text-gray-600 rounded-xl px-3 py-1.5 text-xs hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            {deleteError && deletingTicketId === ticket.id && (
                                <p className="text-red-500 text-xs mt-2">{deleteError}</p>
                            )}

                            {editingTicketId === ticket.id && (
                                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3 shadow-sm">
                                    <p className="text-blue-700 font-semibold text-sm">Edit Ticket</p>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">Title</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full focus:border-blue-400 focus:outline-none bg-white"
                                            placeholder="Ticket title"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">Description</label>
                                        <textarea
                                            value={editForm.description}
                                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full min-h-[80px] resize-none focus:border-blue-400 focus:outline-none bg-white"
                                            placeholder="Describe the issue"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">Priority</label>
                                        <select
                                            value={editForm.priority}
                                            onChange={e => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                                            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full focus:border-blue-400 focus:outline-none bg-white"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>

                                    {editError && (
                                        <p className="text-red-500 text-xs">{editError}</p>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditSubmit(ticket.id)}
                                            disabled={editLoading}
                                            className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                                        >
                                            {editLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            onClick={() => { setEditingTicketId(null); setEditError(""); }}
                                            className="border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm hover:bg-gray-50 transition bg-white"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {expandedTicketId === ticket.id && (
                                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 font-medium mb-1">Full Description</p>
                                            <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-100">{ticket.description || "No description provided."}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium mb-1">Ticket Information</p>
                                            <div className="bg-white p-3 rounded-lg border border-gray-100 space-y-2">
                                                <p><span className="text-gray-500">ID:</span> TH-{ticket.id}</p>
                                                <p><span className="text-gray-500">Created:</span> {formatDate(ticket.createdAt)}</p>
                                                <p><span className="text-gray-500">Last Updated:</span> {formatDate(ticket.updatedAt)}</p>
                                                <p><span className="text-gray-500">Assignee:</span> {ticket?.assigneeName || ticket?.assignedTo?.name || ticket?.assignedTo?.username || "Unassigned"}</p>
                                                <p><span className="text-gray-500">Category:</span> {ticket.category || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {ticket.status === "RESOLVED" && (
                                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                                            <p className="text-sm font-semibold text-green-800 mb-1">Resolution Summary</p>
                                            <p className="text-sm text-green-700">
                                                {ticket?.solution || "No solution provided yet."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasPrevious || loading}
                    onClick={() => setPage(pageParam - 1)}
                >
                    Previous
                </Button>

                <p className="text-sm text-slate-grey">
                    Page {totalPages === 0 ? 0 : pageParam + 1} / {totalPages}
                </p>

                <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasNext || loading}
                    onClick={() => setPage(pageParam + 1)}
                >
                    Next
                </Button>
            </div>
        </section>
    );
}
