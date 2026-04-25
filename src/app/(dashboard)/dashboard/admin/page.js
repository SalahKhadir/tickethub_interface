"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import TicketActions from "@/components/features/TicketActions";
import { getTickets } from "@/services/api";

const STATUS_OPTIONS = ["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "URGENT"];
const VIEW_MODES = {
  ALL: "ALL",
  NEW: "NEW",
  PAST: "PAST",
};

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState(VIEW_MODES.ALL);
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const pageData = await getTickets({
        page: currentPage,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });

      setTickets(Array.isArray(pageData?.content) ? pageData.content : []);
      setCurrentPage(
        typeof pageData?.number === "number" ? pageData.number : 0
      );
      setTotalPages(
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      );
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.error || "";
      setError(backendMessage || "Unable to load tickets.");
      setTickets([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const visibleTickets = useMemo(() => {
    const isPast = (status) => {
      const normalizedStatus = String(status || "").toUpperCase();
      return normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED";
    };

    if (viewMode === VIEW_MODES.NEW) {
      return tickets.filter((ticket) => !isPast(ticket.status));
    }

    if (viewMode === VIEW_MODES.PAST) {
      return tickets.filter((ticket) => isPast(ticket.status));
    }

    return tickets;
  }, [tickets, viewMode]);

  const handleStatusChange = (event) => {
    setCurrentPage(0);
    setStatusFilter(event.target.value);
  };

  const handlePriorityChange = (event) => {
    setCurrentPage(0);
    setPriorityFilter(event.target.value);
  };

  const hasPrevious = currentPage > 0;
  const hasNext = totalPages > 0 && currentPage + 1 < totalPages;

  const handleToggleDetails = (ticketId) => {
    setExpandedTicketId((prev) => (prev === ticketId ? null : ticketId));
  };

  const handleTicketUpdated = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket } : ticket
      )
    );
  };

  const renderViewButton = (mode, label) => {
    const isActive = viewMode === mode;
    return (
      <button
        type="button"
        onClick={() => setViewMode(mode)}
        className={`h-9 rounded-full px-4 text-sm font-semibold transition ${isActive
            ? "bg-electric-sapphire text-bright-snow"
            : "border border-black/10 bg-white text-ink-black hover:border-electric-sapphire"
          }`}
      >
        {label}
      </button>
    );
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink-black">Admin overview</h2>
      <p className="mt-2 text-sm text-slate-grey">
        Interactive workspace to follow new and past tickets.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {renderViewButton(VIEW_MODES.ALL, "All")}
        {renderViewButton(VIEW_MODES.NEW, "New")}
        {renderViewButton(VIEW_MODES.PAST, "Past")}
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-4"
          onClick={loadTickets}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="statusFilter" className="text-sm font-medium text-ink-black">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status || "ALL_STATUS"} value={status}>
                {status || "All"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="priorityFilter" className="text-sm font-medium text-ink-black">
            Priority
          </label>
          <select
            id="priorityFilter"
            value={priorityFilter}
            onChange={handlePriorityChange}
            className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority || "ALL_PRIORITY"} value={priority}>
                {priority || "All"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-strawberry-red/30 bg-strawberry-red/10 px-4 py-3 text-sm text-strawberry-red">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-grey">Loading tickets...</p>
        ) : visibleTickets.length === 0 ? (
          <p className="text-sm text-slate-grey">No ticket found for current filters.</p>
        ) : (
          visibleTickets.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-xl border border-black/10 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
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
                  onClick={() => handleToggleDetails(ticket.id)}
                  className="h-8 rounded-full border border-black/15 px-3 text-xs font-semibold text-ink-black transition hover:border-electric-sapphire"
                >
                  {expandedTicketId === ticket.id ? "Hide details" : "Details"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-grey">
                <span className="rounded-full border border-black/10 px-3 py-1">
                  Status: {ticket.status || "N/A"}
                </span>
                <span className="rounded-full border border-black/10 px-3 py-1">
                  Priority: {ticket.priority || "N/A"}
                </span>
                <span className="rounded-full border border-black/10 px-3 py-1">
                  Category: {ticket.category || "N/A"}
                </span>
              </div>

              <div className="mt-4">
                <TicketActions ticket={ticket} onStatusUpdated={handleTicketUpdated} />
              </div>

              {expandedTicketId === ticket.id ? (
                <div className="mt-4 grid gap-3 rounded-xl border border-black/10 bg-smoke-silver/40 p-4 text-sm text-ink-black md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Ticket ID:</span> {ticket.id || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Created:</span> {ticket.createdAt || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Updated:</span> {ticket.updatedAt || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Assignee:</span> {ticket.assigneeName || "N/A"}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">Reporter:</span> {ticket.createdBy || ticket.clientName || "N/A"}
                  </p>
                </div>
              ) : null}
            </article>
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
