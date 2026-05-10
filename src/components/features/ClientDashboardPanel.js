"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { getTickets, updateTicketStatus, fetchAPI } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import {
    Plus,
    Download,
    Search,
    Eye,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp,
    Ticket,
} from "lucide-react";



const getStatusIcon = (status) => {
    const s = (status || "").toUpperCase();
    switch (s) {
        case "NEW":
            return <AlertCircle size={18} className="text-blue-500" />;
        case "IN_PROGRESS":
            return <Clock size={18} className="text-amber-500" />;
        case "RESOLVED":
            return <CheckCircle size={18} className="text-green-500" />;
        default:
            return <AlertCircle size={18} className="text-gray-400" />;
    }
};

const getCardBorderClass = (priority) => {
    const p = (priority || "LOW").toUpperCase();
    if (p === "CRITICAL" || p === "URGENT") return "border-red-400";
    if (p === "HIGH") return "border-orange-400";
    if (p === "MEDIUM") return "border-yellow-400";
    return "border-blue-400";
};

export default function ClientDashboardPanel() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [expandedSolution, setExpandedSolution] = useState(null);
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const { user } = useAuth();
    const [closingTicketId, setClosingTicketId] = useState(null);
    const [closeTicketErrors, setCloseTicketErrors] = useState({});
    const [deletingTicketId, setDeletingTicketId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", description: "", priority: "" });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    const handleExport = () => {
        if (!filteredTickets.length) return;
        const csvRows = [];
        const headers = ["ID", "Title", "Status", "Priority", "Category", "Assignee", "Created At"];
        csvRows.push(headers.join(","));
        
        filteredTickets.forEach(t => {
            const assignee = t.assigneeName || t.assignedTo?.name || t.assignedTo?.username || "Unassigned";
            const row = [
                `TH-${t.id || ""}`,
                `"${(t.title || "").replace(/"/g, '""')}"`,
                t.status || "",
                t.priority || "",
                t.category || "",
                `"${assignee}"`,
                new Date(t.createdAt || 0).toLocaleString()
            ];
            csvRows.push(row.join(","));
        });
        
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tickethub_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCloseTicket = async (ticketId) => {
        setClosingTicketId(ticketId);
        setCloseTicketErrors((prev) => ({ ...prev, [ticketId]: null }));
        try {
            await updateTicketStatus(ticketId, "CLOSED");
            await loadTickets();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to close ticket.";
            setCloseTicketErrors((prev) => ({ ...prev, [ticketId]: msg }));
        } finally {
            setClosingTicketId(null);
        }
    };

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

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const pageData = await getTickets({ page: 0 });
            setTickets(Array.isArray(pageData?.content) ? pageData.content : []);
        } catch (err) {
            const backendMessage =
                err?.response?.data?.message || err?.response?.data?.error || "";
            setError(backendMessage || "Unable to load tickets.");
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = tickets.length;
        const open = tickets.filter((t) => {
            const s = (t?.status || "").toUpperCase();
            return s === "NEW" || s === "ACCEPTED";
        }).length;
        const inProgress = tickets.filter(
            (t) => (t?.status || "").toUpperCase() === "IN_PROGRESS"
        ).length;
        const resolvedCount = tickets.filter(
            (t) => (t?.status || "").toUpperCase() === "RESOLVED"
        ).length;

        // Calculate average response time
        const resolvedTickets = tickets.filter(t =>
            (t.status === "RESOLVED" || t.status === "CLOSED") &&
            t.createdAt &&
            t.updatedAt
        );

        let avgResponse = "N/A";
        if (resolvedTickets.length > 0) {
            const totalMs = resolvedTickets.reduce((sum, t) => {
                const created = new Date(t.createdAt).getTime();
                const updated = new Date(t.updatedAt).getTime();
                const diff = updated - created;
                return sum + (diff > 0 ? diff : 0);
            }, 0);
            
            const avg = totalMs / resolvedTickets.length;
            const h = Math.floor(avg / 3600000);
            const m = Math.floor((avg % 3600000) / 60000);
            
            if (h === 0 && m === 0) avgResponse = "< 1 min";
            else if (h === 0) avgResponse = `${m} min`;
            else avgResponse = `${h}h ${m}m`;
        }

        return { total, open, inProgress, resolved: resolvedCount, avgResponse };
    }, [tickets]);

    // Filter tickets
    const filteredTickets = useMemo(() => {
        let filtered = [...tickets];

        // Status filter
        if (statusFilter !== "All") {
            if (statusFilter === "Open") {
                filtered = filtered.filter((t) => {
                    const s = (t?.status || "").toUpperCase();
                    return s === "NEW" || s === "ACCEPTED";
                });
            } else if (statusFilter === "In Progress") {
                filtered = filtered.filter(
                    (t) => (t?.status || "").toUpperCase() === "IN_PROGRESS"
                );
            } else if (statusFilter === "Resolved") {
                filtered = filtered.filter(
                    (t) => (t?.status || "").toUpperCase() === "RESOLVED"
                );
            }
        }

        // Search filter (ID or title)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    String(t?.id || "").toLowerCase().includes(term) ||
                    (t?.title || "").toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [tickets, statusFilter, searchTerm]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Support Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage and track your support requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Download size={18} />
                        Export
                    </button>
                    <Link
                        href={ROUTES.CLIENT_NEW_TICKET}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={18} />
                        New Ticket
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="mb-6 grid grid-cols-5 gap-4">
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <Ticket size={24} className="text-blue-600" />
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total Tickets</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <AlertCircle size={24} className="text-blue-500" />
                    <p className="text-2xl font-semibold text-gray-900">{stats.open}</p>
                    <p className="text-sm text-gray-500">Open</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <Clock size={24} className="text-amber-500" />
                    <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <CheckCircle size={24} className="text-green-500" />
                    <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
                    <p className="text-sm text-gray-500">Resolved</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <TrendingUp size={24} className="text-purple-500" />
                    <p className="text-2xl font-semibold text-gray-900">{stats.avgResponse}</p>
                    <p className="text-sm text-gray-500">Avg Response</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search tickets by ID or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 pl-10 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none hover:border-gray-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {["All", "Open", "In Progress", "Resolved"].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${statusFilter === filter
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "border border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="rounded-xl bg-white px-6 py-8 text-center text-sm text-gray-500">
                    Loading tickets...
                </div>
            )}

            {/* Ticket List */}
            {!loading && filteredTickets.length > 0 && (
                <div className="space-y-3">
                    {filteredTickets.map((ticket) => {
                        const status = (ticket?.status || "").toUpperCase();
                        const priority = (ticket?.priority || "LOW").toUpperCase();
                        const category = ticket?.category || "";
                        const assigneeName =
                            ticket?.assigneeName || ticket?.assignedTo?.name || ticket?.assignedTo?.username || "Unassigned";
                        const isResolved = status === "RESOLVED";

                        const userIdentifiers = [user?.email, user?.username, user?.fullName, user?.name].filter(Boolean);
                        const isAuthor = userIdentifiers.includes(ticket?.createdBy) || userIdentifiers.includes(ticket?.clientName);

                        return (
                            <div key={ticket.id}>
                                <div className={`rounded-2xl border bg-white px-6 py-4 shadow-sm ${getCardBorderClass(ticket.priority)}`}>
                                    {/* Top row: badges and buttons */}
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <PriorityBadge priority={ticket.priority} />
                                            <StatusBadge status={ticket.status} />
                                            {category && (
                                                <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md hover:bg-purple-100 cursor-default">
                                                    {category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                            >
                                                <Eye size={16} />
                                                {expandedTicketId === ticket.id ? "Hide Details" : "View Details"}
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
                                            {isResolved && (
                                                <button
                                                    onClick={() =>
                                                        setExpandedSolution(
                                                            expandedSolution === ticket.id ? null : ticket.id
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    <CheckCircle size={16} />
                                                    Solution
                                                </button>
                                            )}
                                            {isResolved && isAuthor && (
                                                <div className="relative flex flex-col items-end">
                                                    <button
                                                        onClick={() => handleCloseTicket(ticket.id)}
                                                        disabled={closingTicketId === ticket.id}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                                    >
                                                        {closingTicketId === ticket.id ? (
                                                            <>
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                                Closing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ti ti-lock"></i>
                                                                Close Ticket
                                                            </>
                                                        )}
                                                    </button>
                                                    {closeTicketErrors[ticket.id] && (
                                                        <span className="absolute top-full mt-1 right-0 text-red-500 text-xs whitespace-nowrap">
                                                            {closeTicketErrors[ticket.id]}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="mb-2 text-base font-medium text-gray-900">
                                        {ticket?.title || "Untitled"}
                                    </h3>

                                    {/* Description */}
                                    {ticket?.description && (
                                        <p className="mb-3 text-sm text-gray-500">{ticket.description}</p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Ticket size={14} />
                                            TH-{ticket?.id || "0"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            📅 {formatDate(ticket?.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            👤 {assigneeName}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            💬 0 comments
                                        </span>
                                    </div>
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

                                {/* Expanded Details */}
                                {expandedTicketId === ticket.id && (
                                    <div className="rounded-b-2xl border border-t-0 border-gray-100 bg-gray-50 px-6 py-4">
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
                                                    <p><span className="text-gray-500">Assignee:</span> {assigneeName}</p>
                                                    <p><span className="text-gray-500">Category:</span> {ticket.category || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Solution Panel (expanded for resolved tickets) */}
                                {isResolved && expandedSolution === ticket.id && (
                                    <div className="rounded-b-2xl border border-t-0 border-gray-100 bg-green-50 px-6 py-4">
                                        <p className="text-sm font-semibold text-green-800 mb-1">Resolution Summary</p>
                                        <p className="text-sm text-green-700">
                                            {ticket?.solution || "No solution provided yet."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredTickets.length === 0 && !error && (
                <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
                    <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No tickets found</p>
                    <Link
                        href={ROUTES.CLIENT_NEW_TICKET}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={18} />
                        Create your first ticket
                    </Link>
                </div>
            )}
        </div>
    );
}
