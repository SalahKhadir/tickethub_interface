import React from "react";
import { formatSLA } from "@/utils/dateUtils";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";

export default function TechnicianTicketsTable({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="py-6 flex flex-col items-center justify-center">
        <i className="ti ti-inbox text-gray-300 text-4xl mb-2"></i>
        <span className="text-gray-400 text-sm">
          No tickets assigned to this technician yet
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <th className="px-4 py-2 border-b border-gray-100">Ticket ID</th>
            <th className="px-4 py-2 border-b border-gray-100">Title</th>
            <th className="px-4 py-2 border-b border-gray-100">Status</th>
            <th className="px-4 py-2 border-b border-gray-100">Priority</th>
            <th className="px-4 py-2 border-b border-gray-100">SLA</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const sla =
              ticket.priority === "CRITICAL"
                ? formatSLA(ticket.slaDeadline, ticket.status, ticket.updatedAt)
                : null;

            return (
              <tr
                key={ticket.id}
                className={`border-t border-gray-100 hover:bg-white transition border-l-4 ${ticket.priority === "CRITICAL" ? "border-l-red-500 bg-red-50/10" : ticket.priority === "HIGH" ? "border-l-orange-500 bg-orange-50/10" : ticket.priority === "MEDIUM" ? "border-l-yellow-500 bg-yellow-50/10" : "border-l-blue-500 bg-blue-50/10"}`}
              >
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                  TH-{ticket.id}
                </td>
                <td className="px-4 py-3 text-gray-900 text-sm font-medium">
                  {ticket.title || "Untitled"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3">
                  {ticket.priority === "CRITICAL" ? (
                    <span
                      className={
                        sla?.status === "met"
                          ? "text-green-500 font-semibold text-xs"
                          : sla?.overdue
                          ? "text-red-500 font-semibold text-xs"
                          : "text-amber-600 text-xs"
                      }
                    >
                      {sla?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
