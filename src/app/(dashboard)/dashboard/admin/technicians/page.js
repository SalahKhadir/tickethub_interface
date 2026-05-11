"use client";

import React, { useEffect, useState } from "react";
import { getTechnicians } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import TechnicianTicketsTable from "@/components/features/TechnicianTicketsTable";

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [errorTechs, setErrorTechs] = useState(null);
  const [expandedTechId, setExpandedTechId] = useState(null);

  const {
    data: ticketsData,
    loading: ticketsLoading,
    error: ticketsError,
  } = useFetch("/api/tickets?page=0");
  
  const tickets =
    ticketsData?.content ||
    ticketsData?.data ||
    (Array.isArray(ticketsData) ? ticketsData : []);

  useEffect(() => {
    let mounted = true;
    const fetchTechs = async () => {
      try {
        setLoadingTechs(true);
        const data = await getTechnicians();
        if (mounted) {
          setTechnicians(data || []);
          setErrorTechs(null);
        }
      } catch (err) {
        if (mounted) {
          setErrorTechs(err.message || "Failed to load technicians");
        }
      } finally {
        if (mounted) {
          setLoadingTechs(false);
        }
      }
    };
    fetchTechs();
    return () => {
      mounted = false;
    };
  }, []);

  const getActiveCount = (tech) => {
    return tickets.filter((t) => {
      const isAssigned =
        (t.assigneeName && t.assigneeName === tech.fullName) ||
        (tech.username && t.assigneeName === tech.username) ||
        (tech.email && t.assigneeName === tech.email) ||
        t.technicianId === tech.id ||
        t.assignee?.id === tech.id;
      return isAssigned && t.status === "IN_PROGRESS";
    }).length;
  };

  const isLoading = loadingTechs || ticketsLoading;
  const hasError = errorTechs || ticketsError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-400 text-sm">Loading technicians...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500 text-sm">{errorTechs || ticketsError}</span>
      </div>
    );
  }

  const busyTechs = technicians.filter((tech) => getActiveCount(tech) > 0).length;
  const availableTechs = technicians.filter((tech) => getActiveCount(tech) === 0).length;

  return (
    <div className="w-full">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2">
          <i className="ti ti-users text-blue-500 text-3xl"></i>
          <span className="text-sm font-semibold text-gray-500">Total Technicians</span>
          <span className="text-2xl font-bold text-gray-900">{technicians.length}</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2">
          <i className="ti ti-clock text-amber-500 text-3xl"></i>
          <span className="text-sm font-semibold text-gray-500">Busy</span>
          <span className="text-2xl font-bold text-gray-900">{busyTechs}</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2">
          <i className="ti ti-circle-check text-green-500 text-3xl"></i>
          <span className="text-sm font-semibold text-gray-500">Available</span>
          <span className="text-2xl font-bold text-gray-900">{availableTechs}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {technicians.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <i className="ti ti-users text-gray-300 text-5xl"></i>
            <span className="text-gray-500 font-medium">No technicians found</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-gray-100">Name</th>
                <th className="px-6 py-3 border-b border-gray-100">Email</th>
                <th className="px-6 py-3 border-b border-gray-100">Active Tickets</th>
                <th className="px-6 py-3 border-b border-gray-100">Status</th>
                <th className="px-6 py-3 border-b border-gray-100 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => {
                const activeCount = getActiveCount(tech);
                const name =
                  tech.fullName || tech.username || tech.email || "Unknown";
                const initials = name.substring(0, 2).toUpperCase();

                const isExpanded = expandedTechId === tech.id;
                const assignedTickets = tickets.filter(
                  (t) =>
                    (t.assigneeName && t.assigneeName === tech.fullName) ||
                    (tech.username && t.assigneeName === tech.username)
                );

                return (
                  <React.Fragment key={tech.id || Math.random()}>
                    <tr
                      onClick={() => setExpandedTechId(isExpanded ? null : tech.id)}
                      className={`border-t border-gray-100 transition text-sm cursor-pointer ${
                        isExpanded ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold">
                            {initials}
                          </div>
                          <span className="text-gray-900 font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {tech.email || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                          {activeCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {activeCount > 0 ? (
                          <span className="bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-medium">
                            Busy
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-medium">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <i
                          className={`ti ti-chevron-down text-gray-400 text-lg transition-transform duration-200 inline-block ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        ></i>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Assigned Tickets</h3>
                            <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                              {assignedTickets.length}
                            </span>
                          </div>
                          <TechnicianTicketsTable tickets={assignedTickets} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
