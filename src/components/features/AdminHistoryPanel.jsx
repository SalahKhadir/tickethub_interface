"use client";

import { useMemo, useState, Fragment } from "react";
import { useFetch } from "@/hooks/useFetch";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ChevronDown, ChevronUp, Clock, CalendarDays } from "lucide-react";

export default function AdminHistoryPanel() {
    const { data, loading, error } = useFetch("/api/tickets?page=0");
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    const tickets = useMemo(() => Array.isArray(data?.content) ? data.content : [], [data]);

    const groupedTickets = useMemo(() => {
        const resolved = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");
        const grouped = {};
        resolved.forEach(ticket => {
            const cat = ticket.category || "Uncategorized";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(ticket);
        });
        return grouped;
    }, [tickets]);

    const toggleCategory = (cat) => {
        if (expandedCategory === cat) setExpandedCategory(null);
        else setExpandedCategory(cat);
    };

    const calculateResolutionTime = (ticket) => {
        if (!ticket.createdAt || !ticket.updatedAt) return { display: "N/A", breached: false };
        const created = new Date(ticket.createdAt).getTime();
        const updated = new Date(ticket.updatedAt).getTime();
        const diff = updated - created;
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        
        let breached = false;
        if (ticket.slaDeadline) {
            breached = updated > new Date(ticket.slaDeadline).getTime();
        }
        return { display: `${hours}h ${mins}m`, breached };
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading history...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    const categories = Object.keys(groupedTickets).sort();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Resolved Tickets History</h1>
                <p className="text-sm text-gray-500 mt-1">Review historical ticket resolution performance by category</p>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-4xl block mb-3 text-gray-300">🗄️</span>
                    <p className="text-gray-400 text-sm">No resolved tickets found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map(cat => {
                        const catTickets = groupedTickets[cat];
                        const isExpanded = expandedCategory === cat;
                        
                        // Calculate average
                        let totalTime = 0;
                        let validTimes = 0;
                        catTickets.forEach(t => {
                            if (t.createdAt && t.updatedAt) {
                                totalTime += new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
                                validTimes++;
                            }
                        });
                        const avgHours = validTimes > 0 ? Math.floor(totalTime / validTimes / 3600000) : 0;
                        const avgMins = validTimes > 0 ? Math.floor((totalTime / validTimes % 3600000) / 60000) : 0;

                        return (
                            <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                                <div 
                                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => toggleCategory(cat)}
                                >
                                    <div className="flex flex-col">
                                        <h3 className="text-base font-semibold text-gray-900">{cat}</h3>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <span className="font-medium text-blue-600">{catTickets.length} tickets</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span>Avg resolution: {avgHours}h {avgMins}m</span>
                                        </p>
                                    </div>
                                    <div className="text-gray-400 bg-gray-50 p-1.5 rounded-full hover:bg-gray-100 transition">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left">Ticket ID</th>
                                                        <th className="px-6 py-3 text-left">Title</th>
                                                        <th className="px-6 py-3 text-left">Priority</th>
                                                        <th className="px-6 py-3 text-left">Status</th>
                                                        <th className="px-6 py-3 text-left">Assignee</th>
                                                        <th className="px-6 py-3 text-left">Resolved At</th>
                                                        <th className="px-6 py-3 text-left">Resolution Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {catTickets.map(ticket => {
                                                        const res = calculateResolutionTime(ticket);
                                                        return (
                                                            <Fragment key={ticket.id}>
                                                                <tr 
                                                                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                                                    className={`border-t border-gray-100 transition cursor-pointer ${expandedTicketId === ticket.id ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                                                                >
                                                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">TH-{ticket.id}</td>
                                                                    <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate" title={ticket.title}>{ticket.title}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={ticket.priority} /></td>
                                                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={ticket.status} /></td>
                                                                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{ticket.assigneeName || ticket.assignedTo?.name || "Unassigned"}</td>
                                                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap flex items-center gap-1.5">
                                                                        <CalendarDays size={14} className="text-gray-400"/>
                                                                        {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : "N/A"}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Clock size={14} className={res.breached ? "text-red-400" : "text-green-500"}/>
                                                                            <span className={`font-medium ${res.breached ? "text-red-600" : "text-gray-700"}`}>
                                                                                {res.display}
                                                                            </span>
                                                                            {res.breached && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 tracking-wide border border-red-200">SLA BREACH</span>}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {expandedTicketId === ticket.id && (
                                                                    <tr className="bg-blue-50/30 border-b border-blue-100/50">
                                                                        <td colSpan={7} className="px-6 py-5">
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
