"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { updateTicketStatus, getTechnicianStats } from "@/services/api";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { Ticket, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const DEFAULT_STATS = { totalAssigned: 0, inProgress: 0, critical: 0, resolvedToday: 0 };

export default function TechnicianDashboardPage() {
  const { data, refetch } = useFetch("/api/tickets?page=0&status=NEW,ACCEPTED,IN_PROGRESS");
  const tickets = useMemo(() => Array.isArray(data?.content) ? data.content : [], [data]);
  const { user } = useAuth();

  const [stats, setStats]           = useState(DEFAULT_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setStatsLoading(true);
    getTechnicianStats()
      .then((s) => {
        if (active) setStats({
          totalAssigned: s.assignedTickets  ?? s.totalAssigned  ?? 0,
          inProgress:    s.inProgress                           ?? 0,
          critical:      s.criticalPriority ?? s.critical       ?? 0,
          resolvedToday: s.resolvedToday                        ?? 0,
        });
      })
      .catch(() => {
        // fallback: derive from active tickets already fetched
        if (active) setStats({
          totalAssigned: tickets.length,
          inProgress:    tickets.filter(t => t.status === "IN_PROGRESS").length,
          critical:      tickets.filter(t => t.priority === "CRITICAL").length,
          resolvedToday: 0,
        });
      })
      .finally(() => { if (active) setStatsLoading(false); });
    return () => { active = false; };
  }, [tickets]);

  const slaBreached = tickets.filter(t =>
    t.priority === "CRITICAL" &&
    t.slaDeadline &&
    new Date(t.slaDeadline).getTime() < Date.now()
  );

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [solution, setSolution] = useState("");

  const handleStartWork = async (ticketId) => {
    await updateTicketStatus(ticketId, "IN_PROGRESS");
    refetch();
  };

  const handleResolve = (ticket) => {
    setResolvingTicket(ticket.id);
    setSolution("");
  };

  const handleSubmitSolution = async (ticketId) => {
    if (!solution.trim()) return;
    await updateTicketStatus(ticketId, "RESOLVED", { solution });
    setResolvingTicket(null);
    refetch();
  };

  const formatSLA = (ticket) => {
    const status = String(ticket?.status || "").toUpperCase();
    if (status === "RESOLVED" || status === "CLOSED") {
      return <span className="text-gray-300">—</span>;
    }

    if (ticket.priority !== "CRITICAL" || !ticket.slaDeadline) {
      return <span className="text-gray-300">—</span>;
    }

    const diff = new Date(ticket.slaDeadline).getTime() - Date.now();
    const abs = Math.abs(diff);
    const totalMinutes = Math.floor(abs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const timeLabel = `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m`;

    return diff > 0
      ? <span className="text-amber-600 text-xs font-medium">{timeLabel} remaining</span>
      : <span className="text-red-500 text-xs font-bold animate-pulse">{timeLabel} overdue</span>;
  };

  const renderAction = (ticket) => {
    if (resolvingTicket === ticket.id) {
      return (
        <div className="flex flex-col gap-2 min-w-50">
          <textarea
            value={solution}
            onChange={e => setSolution(e.target.value)}
            placeholder="Describe the solution..."
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs w-full min-h-15 resize-none focus:border-blue-400 outline-none transition"
          />
          <div className="flex gap-2">
            <button onClick={() => handleSubmitSolution(ticket.id)}
              disabled={!solution.trim()}
              className="bg-green-600 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition">
              Submit
            </button>
            <button onClick={() => setResolvingTicket(null)}
              className="border border-gray-200 text-gray-500 rounded-xl px-3 py-1.5 text-xs hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      );
    }
    if (ticket.status === "ACCEPTED" || ticket.status === "NEW") return (
      <button onClick={() => handleStartWork(ticket.id)}
        className="bg-blue-600 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1 shadow-sm hover:-translate-y-0.5 hover:shadow">
        ▶ Start Work
      </button>
    );
    if (ticket.status === "IN_PROGRESS") return (
      <button onClick={() => handleResolve(ticket)}
        className="bg-gray-900 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-gray-700 transition flex items-center gap-1 shadow-sm hover:-translate-y-0.5 hover:shadow">
        ✓ Resolve
      </button>
    );
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") return (
      <span className="bg-gray-100 text-gray-400 rounded-xl px-3 py-1.5 text-xs font-medium cursor-default border border-gray-200">Done</span>
    );
    return <span className="text-gray-300 text-xs">—</span>;
  };

  return (
    <div className="space-y-6 max-w-300 mx-auto w-full pb-10">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.username || user?.name || "Technician"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's on your plate today</p>
      </div>

      {/* SLA breach banner */}
      {slaBreached.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-lg animate-pulse">⚠</span>
            <span className="text-red-600 font-medium text-sm">
              {slaBreached.length} critical ticket(s) have breached their 2h SLA and need immediate attention
            </span>
          </div>
          <Link href="/technician/tickets" className="text-red-600 text-xs font-semibold hover:underline">
            View Now →
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* card: My Tickets - blue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition cursor-default">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Assigned Tickets</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? "…" : stats.totalAssigned}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Ticket size={24} />
          </div>
        </div>

        {/* card: In Progress - amber */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition cursor-default">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? "…" : stats.inProgress}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
        </div>

        {/* card: Critical - red */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition cursor-default">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Critical Priority</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? "…" : stats.critical}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* card: Resolved Today - green */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition cursor-default">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? "…" : stats.resolvedToday}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Tickets</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your 5 most recent assigned tickets</p>
          </div>
          <Link href="/technician/tickets"
            className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 transition">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Ticket ID</th>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">SLA</th>
                <th className="px-6 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map(ticket => (
                <tr key={ticket.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 transition ${ticket.priority === "CRITICAL" ? "border-l-4 border-l-red-400" : ""}`}>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs whitespace-nowrap">TH-{ticket.id}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium text-sm max-w-50 truncate" title={ticket.title}>{ticket.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatSLA(ticket)}</td>
                  <td className="px-6 py-4">{renderAction(ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recentTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-2">📭</span>
            <p className="text-sm">No tickets assigned to you yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
