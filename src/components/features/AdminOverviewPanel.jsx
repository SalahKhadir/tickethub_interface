"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { ROUTES } from "@/constants/routes";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import {
    AlertTriangle,
    CheckCircle2,
    Ticket,
    Users,
    ArrowRight,
} from "lucide-react";

const formatDate = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
};


const Card = ({ icon: Icon, title, value, iconBg, iconColor }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-3">
        <div className={`${iconBg} ${iconColor} p-3 rounded-xl`}>
            <Icon size={24} />
        </div>
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
    </div>
);

export default function AdminOverviewPanel() {
    const router = useRouter();

    const { data: pageData, loading, error, refetch } = useFetch("/api/tickets?page=0", {
        fallbackUrls: ["/api/admin/tickets?page=0"],
    });

    const tickets = useMemo(() => {
        return Array.isArray(pageData?.content) ? pageData.content : [];
    }, [pageData]);

    const stats = useMemo(() => {
        const slaBreaches = tickets.filter(t =>
            t.priority === "CRITICAL" &&
            t.slaDeadline &&
            new Date(t.slaDeadline).getTime() < Date.now() &&
            t.status !== "RESOLVED" &&
            t.status !== "CLOSED"
        );
        const activeTechnicians = new Set(
            tickets.filter(t => t.status === "IN_PROGRESS" && t.assigneeName)
                .map(t => t.assigneeName)
        ).size;
        const criticalTickets = tickets.filter(t => t.priority === "CRITICAL").length;
        const resolvedToday = tickets.filter(t => {
            if (t.status !== "RESOLVED") return false;
            const updated = new Date(t.updatedAt);
            const today = new Date();
            return updated.toDateString() === today.toDateString();
        }).length;

        return {
            slaBreaches: slaBreaches.length,
            slaBreachesList: slaBreaches,
            activeTechnicians,
            criticalTickets,
            resolvedToday,
        };
    }, [tickets]);

    const recentTickets = useMemo(() =>
        [...tickets]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        , [tickets]);

    useEffect(() => {
        const interval = setInterval(() => refetch(), 60000);
        return () => clearInterval(interval);
    }, [refetch]);

    const handleRowClick = () => {
        router.push("/dashboard/admin/tickets");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Support Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Manage and track your support requests</p>
            </div>

            {stats.slaBreachesList?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-3 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-red-500 text-lg">⚠</span>
                        <span className="text-red-600 font-medium text-sm">
                            {stats.slaBreachesList.length} critical ticket(s) have breached their 2h SLA deadline
                        </span>
                    </div>
                    <button onClick={() => router.push('/dashboard/admin/tickets')}
                        className="text-red-600 text-xs font-semibold hover:underline">
                        View Now →
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card
                    icon={AlertTriangle}
                    title="SLA Breaches"
                    value={stats.slaBreaches}
                    iconBg="bg-red-50"
                    iconColor="text-red-500"
                />
                <Card
                    icon={Users}
                    title="Active Technicians"
                    value={stats.activeTechnicians}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
                <Card
                    icon={Ticket}
                    title="Critical Tickets"
                    value={stats.criticalTickets}
                    iconBg="bg-orange-50"
                    iconColor="text-orange-500"
                />
                <Card
                    icon={CheckCircle2}
                    title="Resolved Today"
                    value={stats.resolvedToday}
                    iconBg="bg-green-50"
                    iconColor="text-green-500"
                />
            </div>

            <div className="flex items-center gap-3 my-6">
                <button onClick={() => router.push('/dashboard/admin/tickets')}
                    className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
                    View All Tickets
                </button>
                <button onClick={() => router.push('/dashboard/admin/technicians')}
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-medium hover:border-blue-400 transition flex items-center gap-2">
                    Manage Technicians
                </button>
            </div>

            {/* Recent Tickets Table */}
            <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
                        <p className="text-sm text-gray-500">The most recent five tickets sorted by creation date.</p>
                    </div>
                    <Link
                        href={ROUTES.ADMIN_TICKETS}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                        View all <ArrowRight size={14} />
                    </Link>
                </div>

                {error ? (
                    <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-sm text-red-600">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="px-6 py-8 text-center text-sm text-gray-500">
                        Loading tickets...
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Ticket ID</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Title</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Priority</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Assignee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No tickets found.
                                    </td>
                                </tr>
                            ) : (
                                recentTickets.map((ticket) => {
                                    const status = String(ticket?.status || "").toUpperCase();
                                    const priority = String(ticket?.priority || "").toUpperCase();
                                    const assignee = ticket?.assigneeName || ticket?.assignedTo?.name || "Unassigned";
                                    const isCritical = priority === "CRITICAL";

                                    return (
                                        <tr
                                            key={ticket.id}
                                            onClick={handleRowClick}
                                            className={`border-t border-gray-100 px-6 py-4 hover:bg-gray-50 transition cursor-pointer ${isCritical ? "critical-ticket-row" : ""} border-l-4 ${priority === "CRITICAL" ? "border-l-red-500 bg-red-50/10" : priority === "HIGH" ? "border-l-orange-500 bg-orange-50/10" : priority === "MEDIUM" ? "border-l-yellow-500 bg-yellow-50/10" : "border-l-blue-500 bg-blue-50/10"}`}
                                        >
                                            <td className="px-6 py-4 text-xs font-mono text-gray-400">TH-{ticket?.id || "0"}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{ticket?.title || "Untitled"}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={ticket?.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <PriorityBadge priority={ticket?.priority} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {assignee === "Unassigned" ? (
                                                    <span className="text-gray-400">Unassigned</span>
                                                ) : (
                                                    assignee
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}

                <div className="px-6 py-4 border-t border-gray-100">
                    <Link
                        href={ROUTES.ADMIN_TICKETS}
                        className="text-sm text-blue-600 hover:underline inline-block"
                    >
                        View all tickets →
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                @keyframes criticalTicketPulse {
                  0%, 100% { 
                    box-shadow: inset 4px 0 0 0 #FF4D4F;
                  }
                  50% { 
                    box-shadow: inset 4px 0 0 0 #FF4D4F, 0 0 0 0 rgba(255, 77, 79, 0.3);
                  }
                }
                .critical-ticket-row {
                  animation: criticalTicketPulse 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
