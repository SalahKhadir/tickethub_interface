"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { ROLES } from "@/constants/roles";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ChevronDown, ChevronUp, Clock, CalendarDays, History } from "lucide-react";

const calcResolutionTime = (ticket) => {
    if (!ticket.createdAt || !ticket.updatedAt) return { display: "N/A", breached: false };
    const diff = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
    const hours = Math.floor(diff / 3_600_000);
    const mins  = Math.floor((diff % 3_600_000) / 60_000);
    const breached = ticket.slaDeadline
        ? new Date(ticket.updatedAt).getTime() > new Date(ticket.slaDeadline).getTime()
        : false;
    return { display: `${hours}h ${mins}m`, breached };
};

export default function TechnicianHistoryPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    const isTechnician = String(user?.role || "").toLowerCase() === ROLES.TECHNICIAN;

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !isTechnician) router.replace("/login");
    }, [authLoading, isAuthenticated, isTechnician, router]);

    const { data, loading, error } = useFetch(
        "/api/tickets?page=0&size=100&status=RESOLVED,CLOSED",
        { fallbackUrls: ["/api/tickets?page=0&status=RESOLVED,CLOSED"] }
    );

    const tickets = useMemo(() =>
        Array.isArray(data?.content) ? data.content : [],
    [data]);

    const groupedTickets = useMemo(() => {
        const grouped = {};
        tickets.forEach((t) => {
            const cat = t.category || "Uncategorized";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t);
        });
        return grouped;
    }, [tickets]);

    const categories = useMemo(() => Object.keys(groupedTickets).sort(), [groupedTickets]);

    if (authLoading || (!isAuthenticated && !isTechnician)) return null;

    return (
        <div className="min-h-screen bg-bright-snow p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    <History size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Ticket History</h1>
                    <p className="text-xs text-gray-400 mt-0.5">All resolved and closed tickets assigned to you</p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-gray-400">Loading history…</p>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="text-4xl mb-3">📭</span>
                    <p className="text-sm">No resolved tickets yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map((cat) => {
                        const catTickets = groupedTickets[cat];
                        const isExpanded = expandedCategory === cat;

                        // Average resolution time for category header
                        const validTimes = catTickets.filter((t) => t.createdAt && t.updatedAt);
                        const totalMs = validTimes.reduce((sum, t) =>
                            sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
                        const avgH = validTimes.length ? Math.floor(totalMs / validTimes.length / 3_600_000) : 0;
                        const avgM = validTimes.length ? Math.floor((totalMs / validTimes.length % 3_600_000) / 60_000) : 0;

                        return (
                            <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Category header */}
                                <div
                                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                                >
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">{cat}</h3>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <span className="font-medium text-blue-600">{catTickets.length} tickets</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>Avg resolution: {avgH}h {avgM}m</span>
                                        </p>
                                    </div>
                                    <div className="text-gray-400 bg-gray-50 p-1.5 rounded-full hover:bg-gray-100 transition">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>

                                {/* Ticket table */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left">Ticket ID</th>
                                                        <th className="px-6 py-3 text-left">Title</th>
                                                        <th className="px-6 py-3 text-left">Priority</th>
                                                        <th className="px-6 py-3 text-left">Status</th>
                                                        <th className="px-6 py-3 text-left">Resolved At</th>
                                                        <th className="px-6 py-3 text-left">Resolution Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {catTickets.map((ticket) => {
                                                        const res = calcResolutionTime(ticket);
                                                        const rowExpanded = expandedTicketId === ticket.id;
                                                        return (
                                                            <Fragment key={ticket.id}>
                                                                <tr
                                                                    onClick={() => setExpandedTicketId(rowExpanded ? null : ticket.id)}
                                                                    className={`border-t border-gray-100 cursor-pointer transition ${rowExpanded ? "bg-blue-50/50" : "hover:bg-gray-50/50"}`}
                                                                >
                                                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">TH-{ticket.id}</td>
                                                                    <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate" title={ticket.title}>{ticket.title}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={ticket.priority} /></td>
                                                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={ticket.status} /></td>
                                                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <CalendarDays size={14} className="text-gray-400" />
                                                                            {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : "N/A"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Clock size={14} className={res.breached ? "text-red-400" : "text-green-500"} />
                                                                            <span className={`font-medium ${res.breached ? "text-red-600" : "text-gray-700"}`}>
                                                                                {res.display}
                                                                            </span>
                                                                            {res.breached && (
                                                                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                                                                                    SLA BREACH
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </td>
                                                                </tr>

                                                                {/* Expanded detail row */}
                                                                {rowExpanded && (
                                                                    <tr className="bg-blue-50/30 border-b border-blue-100/50">
                                                                        <td colSpan={6} className="px-6 py-5">
                                                                            <div className="flex gap-6 max-w-5xl">
                                                                                <div className="flex-1">
                                                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Request</h4>
                                                                                    <div className="p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm leading-relaxed">
                                                                                        {ticket.description || "No description provided."}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Resolution</h4>
                                                                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 font-medium shadow-sm leading-relaxed">
                                                                                        {ticket.solution || "No resolution details provided."}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
