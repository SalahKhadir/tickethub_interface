"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { ROLES } from "@/constants/roles";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { updateTicketStatus } from "@/services/api";
import {
    Search,
    AlertTriangle,
    Play,
    Check,
    Clock,
    X,
    Loader2,
} from "lucide-react";

const getInitials = (name) => {
    if (!name) return "?";
    return String(name)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

const formatSLATime = (deadline) => {
    if (!deadline) return null;
    const now = Date.now();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;
    const absoluteDiff = Math.abs(diff);
    const totalMinutes = Math.floor(absoluteDiff / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return {
        overdue: diff < 0,
        days,
        hours,
        minutes,
    };
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

const TicketCard = ({ ticket, onStartWork, onResolveClick }) => {
    const priority = (ticket?.priority || "LOW").toUpperCase();
    const isCritical = priority === "CRITICAL";
    const status = (ticket?.status || "").toUpperCase();
    const showSlaTimer = isCritical && status !== "RESOLVED" && status !== "CLOSED";
    const [slaTime, setSlaTime] = useState(() => formatSLATime(ticket?.slaDeadline));

    useEffect(() => {
        if (!showSlaTimer) {
            return undefined;
        }

        const interval = setInterval(() => {
            setSlaTime(formatSLATime(ticket?.slaDeadline));
        }, 60000);

        return () => clearInterval(interval);
    }, [showSlaTimer, ticket?.slaDeadline, ticket?.status]);

    const authorName = getTicketAuthorName(ticket);
    const authorLabel = authorName || ticket?.authorEmail || "System";
    const authorSubtext = authorName && ticket?.authorEmail ? ticket.authorEmail : "";
    const reporterInitials = getInitials(authorName || authorLabel);

    let borderClass = "border-blue-400";
    if (priority === "CRITICAL" || priority === "URGENT") borderClass = "border-red-400";
    else if (priority === "HIGH") borderClass = "border-orange-400";
    else if (priority === "MEDIUM") borderClass = "border-yellow-400";

    return (
        <div className={`bg-white rounded-2xl border p-4 shadow-sm mb-3 flex flex-col h-full ${borderClass} ${isCritical ? "critical-card bg-[#FFF5F5]" : ""}`}>
            {/* Top row: priority and category */}
            <div className="flex items-center justify-between mb-2">
                <PriorityBadge priority={ticket.priority} />
                {ticket?.category && (
                    <span className="rounded-full px-3 py-1 text-xs border border-gray-200 bg-gray-100 text-gray-600">
                        {ticket.category}
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="text-gray-900 font-medium text-sm mt-2">{ticket?.title || "Untitled"}</h3>

            {/* Description */}
            {ticket?.description && (
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{ticket.description}</p>
            )}

            {/* SLA Timer (only for CRITICAL) */}
            {showSlaTimer && slaTime && (
                <div
                    style={{
                        backgroundColor: slaTime.overdue ? "#FFF1F0" : "#FFF9E6",
                        borderColor: slaTime.overdue ? "#FF4D4F" : "#D46B08",
                        color: slaTime.overdue ? "#FF4D4F" : "#D46B08",
                    }}
                    className="rounded-lg px-3 py-2 mt-2 text-xs flex items-center gap-2 border"
                >
                    <Clock size={14} />
                    <span>
                        {slaTime.days > 0 ? `${slaTime.days}d ` : ""}
                        {slaTime.hours}h {slaTime.minutes}m {slaTime.overdue ? "overdue" : "remaining"}
                    </span>
                </div>
            )}

            {/* Footer: reporter + action pinned to bottom */}
            <div className="mt-auto">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                        {reporterInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-700 text-sm truncate">{authorLabel}</p>
                        {authorSubtext ? (
                            <p className="text-gray-400 text-xs truncate">{authorSubtext}</p>
                        ) : (
                            <p className="text-gray-400 text-xs">TH-{ticket?.id || "0"}</p>
                        )}
                    </div>
                </div>

                <div className="mt-3">
                    {ticket?.status?.toUpperCase() !== "IN_PROGRESS" && ticket?.status?.toUpperCase() !== "RESOLVED" && ticket?.status?.toUpperCase() !== "CLOSED" ? (
                        <button
                            onClick={() => onStartWork(ticket.id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            <Play size={16} />
                            Start Work
                        </button>
                    ) : null}
                    {ticket?.status?.toUpperCase() === "IN_PROGRESS" && (
                        <button
                            onClick={() => onResolveClick(ticket.id)}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            <Check size={16} />
                            Resolve
                        </button>
                    )}
                    {(ticket?.status?.toUpperCase() === "RESOLVED" || ticket?.status?.toUpperCase() === "CLOSED") && (
                        <span className="w-full bg-gray-100 text-gray-400 text-sm font-medium py-2 rounded-xl flex items-center justify-center border border-gray-200 cursor-default">
                            Done
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ title, tickets, status, onStartWork, onResolveClick }) => {
    const isEmpty = tickets.length === 0;

    return (
        <div className="flex-1 min-w-87.5">
            <h2 className="text-gray-900 font-semibold text-base mb-4">
                {title} <span className="text-gray-500">({tickets.length})</span>
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {isEmpty && status === "RESOLVED" ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <AlertTriangle size={40} className="text-gray-300 mb-2" />
                        <p className="text-gray-400 text-sm">No resolved tickets yet</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onStartWork={onStartWork}
                            onResolveClick={onResolveClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default function TechnicianTicketsPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [resolveTicketId, setResolveTicketId] = useState(null);
    const [resolveSolution, setResolveSolution] = useState("");
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState("");

    const isTechnician = String(user?.role || "").toLowerCase() === ROLES.TECHNICIAN;

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!isAuthenticated || !isTechnician) {
            router.replace("/login");
        }
    }, [authLoading, isAuthenticated, isTechnician, router]);

    const { data: pageData, loading, error, refetch } = useFetch("/api/tickets?page=0", {
        fallbackUrls: [],
    });

    const allTickets = useMemo(() => {
        return Array.isArray(pageData?.content) ? pageData.content : [];
    }, [pageData]);

    const searchLower = searchTerm.toLowerCase();
    const filteredTickets = useMemo(() => {
        return allTickets.filter((t) =>
            String(t?.id || "").includes(searchLower) ||
            (t?.title || "").toLowerCase().includes(searchLower)
        );
    }, [allTickets, searchTerm]);

    const newTickets = useMemo(() => {
        return filteredTickets.filter((t) => {
            const s = (t?.status || "").toUpperCase();
            return s !== "IN_PROGRESS" && s !== "RESOLVED" && s !== "CLOSED";
        });
    }, [filteredTickets]);

    const inProgressTickets = useMemo(() => {
        return filteredTickets.filter(
            (t) => (t?.status || "").toUpperCase() === "IN_PROGRESS"
        );
    }, [filteredTickets]);

    const resolvedTickets = useMemo(() => {
        return filteredTickets.filter(
            (t) => (t?.status || "").toUpperCase() === "RESOLVED" || (t?.status || "").toUpperCase() === "CLOSED"
        );
    }, [filteredTickets]);

    const handleStartWork = async (ticketId) => {
        try {
            await updateTicketStatus(ticketId, "IN_PROGRESS");
            refetch();
        } catch (err) {
            console.error("Error starting work:", err);
        }
    };

    const handleResolve = async (ticketId) => {
        if (!resolveSolution.trim()) {
            setResolveError("Please describe the solution before resolving.");
            return;
        }
        setResolving(true);
        setResolveError("");
        try {
            await updateTicketStatus(ticketId, "RESOLVED", { solution: resolveSolution });
            setResolveTicketId(null);
            setResolveSolution("");
            setResolveError("");
            refetch();
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || "Failed to resolve ticket. Try again.";
            setResolveError(message);
        } finally {
            setResolving(false);
        }
    };

    const closeResolveModal = () => {
        if (resolving) return;
        setResolveTicketId(null);
        setResolveSolution("");
        setResolveError("");
    };

    if (authLoading || (!isAuthenticated && !isTechnician)) {
        return null;
    }

    return (
        <div className="min-h-screen bg-bright-snow p-6">
            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Kanban Columns */}
            {loading ? (
                <div className="text-center text-gray-500 py-8">Loading tickets...</div>
            ) : (
                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-3 gap-8">
                        <KanbanColumn
                            title="New Tickets"
                            tickets={newTickets}
                            status="NEW"
                            onStartWork={handleStartWork}
                            onResolveClick={() => { }}
                        />
                        <KanbanColumn
                            title="In Progress"
                            tickets={inProgressTickets}
                            status="IN_PROGRESS"
                            onStartWork={() => { }}
                            onResolveClick={(ticketId) => setResolveTicketId(ticketId)}
                        />
                        <KanbanColumn
                            title="Resolved"
                            tickets={resolvedTickets}
                            status="RESOLVED"
                            onStartWork={() => { }}
                            onResolveClick={() => { }}
                        />
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {resolveTicketId && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) closeResolveModal(); }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-gray-900 font-bold text-lg">Resolve Ticket</h2>
                                <p className="text-xs text-gray-400 mt-0.5">TH-{resolveTicketId} · Provide a resolution summary</p>
                            </div>
                            <button
                                onClick={closeResolveModal}
                                disabled={resolving}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition disabled:opacity-40"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Resolution Details <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={resolveSolution}
                                    onChange={(e) => { setResolveSolution(e.target.value); setResolveError(""); }}
                                    placeholder="Describe what was done to resolve this issue..."
                                    rows={5}
                                    disabled={resolving}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 transition resize-none disabled:opacity-60 ${resolveError
                                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                        : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                                        }`}
                                />
                                {resolveError && (
                                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        {resolveError}
                                    </p>
                                )}
                                <p className="mt-1.5 text-xs text-gray-400">
                                    {resolveSolution.trim().length} characters · minimum 10 recommended
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={closeResolveModal}
                                disabled={resolving}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleResolve(resolveTicketId)}
                                disabled={resolving || !resolveSolution.trim()}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-gray-900 disabled:hover:shadow-none"
                            >
                                {resolving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Resolving...</>
                                ) : (
                                    <><Check size={16} /> Mark as Resolved</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes criticalPulse {
                  0%, 100% { 
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); 
                    border-color: #FCA5A5; 
                  }
                  50% { 
                    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); 
                    border-color: #EF4444; 
                  }
                }
                .critical-card {
                  animation: criticalPulse 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
