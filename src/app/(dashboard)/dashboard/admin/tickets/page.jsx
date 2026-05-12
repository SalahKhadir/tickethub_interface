"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import TicketCard from "@/components/features/TicketCard";
import TicketActions from "@/components/features/TicketActions";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { ROLES } from "@/constants/roles";
import { assignTicket, getTechnicians } from "@/services/api";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_OPTIONS = ["", "NEW", "ACCEPTED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "URGENT"];

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

export default function AdminTicketsPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [currentPage, setCurrentPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [loadingTechnicians, setLoadingTechnicians] = useState(false);
    const [assignmentOpenTicketId, setAssignmentOpenTicketId] = useState(null);
    const [selectedTechnicianByTicket, setSelectedTechnicianByTicket] = useState({});
    const [searchTechnicianByTicket, setSearchTechnicianByTicket] = useState({});
    const [assigningTicketId, setAssigningTicketId] = useState(null);
    const [assignmentErrorByTicket, setAssignmentErrorByTicket] = useState({});
    const [assignmentFeedback, setAssignmentFeedback] = useState({
        type: "",
        message: "",
    });
    const [assignedTechnicianByTicket, setAssignedTechnicianByTicket] = useState({});

    const isAdmin = String(user?.role || "").toLowerCase() === ROLES.ADMIN;

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!isAuthenticated || !isAdmin) {
            router.replace("/login");
        }
    }, [authLoading, isAuthenticated, isAdmin, router]);

    const ticketsUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        if (statusFilter) {
            params.set("status", statusFilter);
        }
        if (priorityFilter) {
            params.set("priority", priorityFilter);
        }
        return `/api/tickets?${params.toString()}`;
    }, [currentPage, statusFilter, priorityFilter]);

    const {
        data: pageData,
        loading,
        error,
        refetch,
    } = useFetch(ticketsUrl, {
        fallbackUrls: [`/api/admin/tickets?page=${currentPage}`],
    });

    const tickets = useMemo(() => {
        return Array.isArray(pageData?.content) ? pageData.content : [];
    }, [pageData]);

    const totalPages = typeof pageData?.totalPages === "number" ? pageData.totalPages : 0;
    const hasPrevious = currentPage > 0;
    const hasNext = totalPages > 0 && currentPage + 1 < totalPages;

    const handleStatusChange = (event) => {
        setCurrentPage(0);
        setStatusFilter(event.target.value);
    };

    const handlePriorityChange = (event) => {
        setCurrentPage(0);
        setPriorityFilter(event.target.value);
    };

    const handleToggleAssignment = async (ticketId) => {
        setAssignmentErrorByTicket((prev) => ({ ...prev, [ticketId]: "" }));
        setAssignmentOpenTicketId((prev) => (prev === ticketId ? null : ticketId));

        if (technicians.length > 0 || loadingTechnicians) {
            return;
        }

        setLoadingTechnicians(true);
        try {
            const payload = await getTechnicians();
            const list = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.content)
                    ? payload.content
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];
            setTechnicians(list);
        } catch (err) {
            setAssignmentErrorByTicket((prev) => ({
                ...prev,
                [ticketId]:
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load technicians.",
            }));
        } finally {
            setLoadingTechnicians(false);
        }
    };

    const handleAssignSubmit = async (ticketId) => {
        const technicianId = selectedTechnicianByTicket[ticketId];
        if (!technicianId) {
            setAssignmentErrorByTicket((prev) => ({
                ...prev,
                [ticketId]: "Please select a technician.",
            }));
            return;
        }

        const numericTechId = Number(technicianId);
        if (Number.isNaN(numericTechId)) {
            setAssignmentErrorByTicket((prev) => ({
                ...prev,
                [ticketId]: "Technician id must be numeric.",
            }));
            return;
        }

        setAssigningTicketId(ticketId);
        setAssignmentErrorByTicket((prev) => ({ ...prev, [ticketId]: "" }));
        setAssignmentFeedback({ type: "", message: "" });

        const selectedTechnician = technicians.find((technician) => {
            const value = Number(
                technician?.id || technician?.userId || technician?.technicianId || NaN
            );
            return value === numericTechId;
        });

        try {
            await assignTicket(ticketId, numericTechId);
            setAssignedTechnicianByTicket((prev) => ({
                ...prev,
                [ticketId]:
                    selectedTechnician?.fullName ||
                    selectedTechnician?.username ||
                    selectedTechnician?.email ||
                    `Technician ${numericTechId}`,
            }));

            await refetch();
            setAssignmentOpenTicketId(null);
            setAssignmentFeedback({
                type: "success",
                message: "Ticket assigned successfully.",
            });
        } catch (err) {
            const status = err?.response?.status;
            const backendMessage =
                err?.response?.data?.message || err?.response?.data?.error || "";
            const clearMessage = backendMessage
                ? `Assignment failed (HTTP ${status || "?"}): ${backendMessage}`
                : err?.message || "Unable to assign this ticket.";

            setAssignmentErrorByTicket((prev) => ({
                ...prev,
                [ticketId]: clearMessage,
            }));
            setAssignmentFeedback({
                type: "error",
                message: clearMessage,
            });
        } finally {
            setAssigningTicketId(null);
        }
    };

    if (authLoading || (!isAuthenticated && !isAdmin)) {
        return null;
    }

    return (
        <section className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-grey">
                        Admin workspace
                    </p>
                    <h1 className="mt-3 text-[22px] font-semibold text-ink-black">
                        My tickets
                    </h1>
                    <p className="mt-2 text-sm text-slate-grey">
                        Track tickets, review details, and manage assignments.
                    </p>
                </div>

                {assignmentFeedback.message ? (
                    <div
                        className={`mt-4 rounded-[10px] border px-4 py-3 text-sm ${assignmentFeedback.type === "success"
                            ? "border-[rgba(16,185,129,0.25)] bg-[#D1FAE5] text-[#065F46]"
                            : "border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] text-[#991B1B]"
                            }`}
                        role="alert"
                    >
                        {assignmentFeedback.message}
                    </div>
                ) : null}

                <Button type="button" variant="ghost" className="h-11 px-5" onClick={() => router.back()}>
                    ← Back to dashboard
                </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="h-11 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
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
                        className="h-11 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                    >
                        {PRIORITY_OPTIONS.map((priority) => (
                            <option key={priority || "ALL_PRIORITY"} value={priority}>
                                {priority || "All priorities"}
                            </option>
                        ))}
                    </select>
                </div>

                <Button type="button" variant="ghost" className="h-11 px-5" onClick={refetch} disabled={loading}>
                    Refresh
                </Button>
            </div>

            {error ? (
                <div className="mt-4 rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]">
                    {error}
                </div>
            ) : null}

            <div className="mt-6 space-y-3">
                {loading ? (
                    <p className="text-sm text-slate-grey">Loading tickets...</p>
                ) : tickets.length === 0 ? (
                    <div className="flex min-h-55 items-center justify-center rounded-[14px] border border-[rgba(17,24,39,0.08)] bg-bright-snow px-6 text-center text-sm text-slate-grey">
                        No tickets found.
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            expanded={expandedTicketId === ticket.id}
                            onToggleDetails={() =>
                                setExpandedTicketId((prev) => (prev === ticket.id ? null : ticket.id))
                            }
                            headerRight={(() => {
                                const status = String(ticket.status || "").toUpperCase();
                                const isAssignable = status === "ACCEPTED" || status === "NEW";
                                const assigneeName = ticket.assigneeName || assignedTechnicianByTicket[ticket.id];

                                if (!isAssignable) return null;

                                if (assigneeName) {
                                    return (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            {assigneeName}
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white rounded-xl px-4 py-1.5 text-xs font-bold hover:bg-blue-700 hover:shadow-md transition-all active:translate-y-0 hover:-translate-y-0.5"
                                        onClick={() => handleToggleAssignment(ticket.id)}
                                    >
                                        Assign Tech
                                    </button>
                                );
                            })()}
                            details={
                                <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-5 text-sm text-gray-800 md:grid-cols-2 shadow-inner">
                                    <div className="space-y-3">
                                        <p className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Ticket ID</span>
                                            <span className="font-medium text-gray-900 font-mono">TH-{ticket.id || "0"}</span>
                                        </p>
                                        <p className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Created At</span>
                                            <span className="font-medium text-gray-900">{formatDate(ticket.createdAt)}</span>
                                        </p>
                                        <p className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Updated At</span>
                                            <span className="font-medium text-gray-900">{formatDate(ticket.updatedAt)}</span>
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Assignee</span>
                                            <span className="font-medium text-gray-900">{ticket.assigneeName || assignedTechnicianByTicket[ticket.id] || "Unassigned"}</span>
                                        </p>
                                        <p className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Reporter</span>
                                            <span className="font-medium text-gray-900">{ticket.createdBy || ticket.clientName || "Unknown"}</span>
                                        </p>
                                        <p className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">SLA Deadline</span>
                                            <span className="font-medium text-red-600">{formatDate(ticket.slaDeadline)}</span>
                                        </p>
                                    </div>
                                    {ticket.solution && (
                                        <div className="md:col-span-2 mt-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Resolution details</h4>
                                            <p className="text-sm text-blue-900 font-medium leading-relaxed">{ticket.solution}</p>
                                        </div>
                                    )}
                                </div>
                            }
                        >
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600 uppercase tracking-wider inline-flex items-center shadow-sm">
                                    {ticket.category || "Uncategorized"}
                                </span>
                            </div>

                            <div className="mt-5">
                                <TicketActions ticket={ticket} onActionComplete={refetch} />
                            </div>

                            {assignmentOpenTicketId === ticket.id ? (
                                <div className="mt-5 space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <label
                                        htmlFor={`technician-${ticket.id}`}
                                        className="text-sm font-bold text-gray-800"
                                    >
                                        Assign Technician
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="search"
                                            value={searchTechnicianByTicket[ticket.id] || ""}
                                            onChange={(event) =>
                                                setSearchTechnicianByTicket((prev) => ({
                                                    ...prev,
                                                    [ticket.id]: event.target.value,
                                                }))
                                            }
                                            placeholder="Search by name, email..."
                                            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                        <select
                                            id={`technician-${ticket.id}`}
                                            value={selectedTechnicianByTicket[ticket.id] || ""}
                                            onChange={(event) =>
                                                setSelectedTechnicianByTicket((prev) => ({
                                                    ...prev,
                                                    [ticket.id]: event.target.value,
                                                }))
                                            }
                                            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                        >
                                            <option value="">Select Technician...</option>
                                            {technicians
                                                .filter((technician) => {
                                                    const keyword = String(searchTechnicianByTicket[ticket.id] || "")
                                                        .trim()
                                                        .toLowerCase();
                                                    if (!keyword) {
                                                        return true;
                                                    }

                                                    const value = String(
                                                        technician?.id || technician?.userId || technician?.technicianId || ""
                                                    ).toLowerCase();
                                                    const label = String(
                                                        technician?.fullName ||
                                                        technician?.username ||
                                                        technician?.email ||
                                                        ""
                                                    ).toLowerCase();

                                                    return value.includes(keyword) || label.includes(keyword);
                                                })
                                                .map((technician) => {
                                                    const value = String(
                                                        technician?.id || technician?.userId || technician?.technicianId || ""
                                                    );
                                                    const label =
                                                        technician?.fullName ||
                                                        technician?.username ||
                                                        technician?.email ||
                                                        `Technician ${value}`;
                                                    return (
                                                        <option key={value} value={value}>
                                                            {label}
                                                        </option>
                                                    );
                                                })}
                                        </select>

                                        {loadingTechnicians ? (
                                            <p className="text-sm text-gray-500 font-medium col-span-full">Loading technicians...</p>
                                        ) : null}
                                    </div>

                                    {assignmentErrorByTicket[ticket.id] ? (
                                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{assignmentErrorByTicket[ticket.id]}</p>
                                    ) : null}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => handleAssignSubmit(ticket.id)}
                                            className="bg-gray-900 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-gray-800 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                                            disabled={assigningTicketId === ticket.id || loadingTechnicians}
                                        >
                                            {assigningTicketId === ticket.id ? "Assigning..." : "Confirm Assignment"}
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </TicketCard>
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
