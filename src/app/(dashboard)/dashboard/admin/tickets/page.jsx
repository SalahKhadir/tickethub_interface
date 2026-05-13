"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import TicketCard from "@/components/features/TicketCard";
import TicketActions from "@/components/features/TicketActions";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { ROLES } from "@/constants/roles";
import { assignTicket, getTechnicians, getTechnicianAvailability } from "@/services/api";
import PriorityBadge from "@/components/ui/PriorityBadge";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_OPTIONS   = ["", "NEW", "ACCEPTED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CATEGORY_OPTIONS = ["", "HARDWARE", "SOFTWARE", "NETWORK", "SECURITY", "OTHER"];
const OVERLOAD_THRESHOLD = 3;

const formatDate = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

// ── Smart technician card ────────────────────────────────────────────────────
function TechnicianCard({ technician, activeCount, selected, onSelect }) {
    const overloaded = activeCount > OVERLOAD_THRESHOLD;
    const id = String(technician?.id || technician?.userId || technician?.technicianId || "");
    const label = technician?.fullName || technician?.username || technician?.email || `Technician ${id}`;

    return (
        <button
            type="button"
            onClick={() => onSelect(id)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 ${
                selected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : overloaded
                    ? "border-red-200 bg-red-50/40 hover:border-red-300"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
                <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        overloaded
                            ? "bg-red-100 text-red-600 border border-red-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                >
                    {overloaded && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {activeCount} active
                </span>
            </div>
            {overloaded && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                    ⚠ High workload — consider another technician
                </p>
            )}
        </button>
    );
}

// ── Assignment panel ─────────────────────────────────────────────────────────
function AssignmentPanel({ ticketId, onAssigned, onCancel }) {
    const [technicians, setTechnicians]       = useState([]);
    const [availability, setAvailability]     = useState({});
    const [search, setSearch]                 = useState("");
    const [selectedId, setSelectedId]         = useState("");
    const [loading, setLoading]               = useState(true);
    const [assigning, setAssigning]           = useState(false);
    const [error, setError]                   = useState("");

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [techs, avail] = await Promise.allSettled([
                    getTechnicians(),
                    getTechnicianAvailability(),
                ]);
                if (!active) return;
                if (techs.status === "fulfilled") setTechnicians(techs.value);
                if (avail.status === "fulfilled") setAvailability(avail.value);
            } catch {
                // individual errors handled below
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const filtered = useMemo(() => {
        const kw = search.trim().toLowerCase();
        if (!kw) return technicians;
        return technicians.filter((t) => {
            const name = String(t?.fullName || t?.username || t?.email || "").toLowerCase();
            const id   = String(t?.id || t?.userId || t?.technicianId || "").toLowerCase();
            return name.includes(kw) || id.includes(kw);
        });
    }, [technicians, search]);

    const handleConfirm = async () => {
        if (!selectedId) { setError("Please select a technician."); return; }
        setAssigning(true);
        setError("");
        try {
            await assignTicket(ticketId, Number(selectedId));
            const tech = technicians.find((t) =>
                String(t?.id || t?.userId || t?.technicianId || "") === selectedId
            );
            onAssigned(tech?.fullName || tech?.username || tech?.email || `Technician ${selectedId}`);
        } catch (err) {
            setError(
                err?.response?.data?.message || err?.message || "Unable to assign ticket."
            );
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Assign Technician</p>
                <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">
                    Cancel
                </button>
            </div>

            <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />

            {loading ? (
                <p className="text-sm text-gray-400">Loading technicians…</p>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-400">No technicians found.</p>
            ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {filtered.map((tech) => {
                        const id = String(tech?.id || tech?.userId || tech?.technicianId || "");
                        const count = availability[id] ?? 0;
                        return (
                            <TechnicianCard
                                key={id}
                                technician={tech}
                                activeCount={count}
                                selected={selectedId === id}
                                onSelect={setSelectedId}
                            />
                        );
                    })}
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    {error}
                </p>
            )}

            <div className="flex justify-end pt-1">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={assigning || loading || !selectedId}
                    className="bg-gray-900 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-gray-800 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                >
                    {assigning ? "Assigning…" : "Confirm Assignment"}
                </button>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTicketsPage() {
    const router      = useRouter();
    const pathname    = usePathname();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, isAuthenticated } = useAuth();

    // Read filters from URL
    const pageParam     = Number(searchParams.get("page")     || "0");
    const statusParam   = searchParams.get("status")   || "";
    const priorityParam = searchParams.get("priority") || "";
    const categoryParam = searchParams.get("category") || "";

    const [expandedTicketId,         setExpandedTicketId]         = useState(null);
    const [assignmentOpenTicketId,   setAssignmentOpenTicketId]   = useState(null);
    const [assignedTechnicianByTicket, setAssignedTechnicianByTicket] = useState({});
    const [assignmentFeedback,       setAssignmentFeedback]       = useState({ type: "", message: "" });

    const isAdmin = String(user?.role || "").toLowerCase() === ROLES.ADMIN;

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !isAdmin) router.replace("/login");
    }, [authLoading, isAuthenticated, isAdmin, router]);

    // Push filter changes to URL
    const pushParams = useCallback((updates) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v) params.set(k, v); else params.delete(k);
        });
        params.set("page", "0"); // reset to first page on filter change
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    const setPage = useCallback((p) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    const ticketsUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(pageParam));
        if (statusParam)   params.set("status",   statusParam);
        if (priorityParam) params.set("priority", priorityParam);
        if (categoryParam) params.set("category", categoryParam);
        return `/api/tickets?${params.toString()}`;
    }, [pageParam, statusParam, priorityParam, categoryParam]);

    const { data: pageData, loading, error, refetch } = useFetch(ticketsUrl, {
        fallbackUrls: [`/api/admin/tickets?page=${pageParam}`],
    });

    const tickets    = useMemo(() => Array.isArray(pageData?.content) ? pageData.content : [], [pageData]);
    const totalPages = typeof pageData?.totalPages === "number" ? pageData.totalPages : 0;

    const handleAssigned = useCallback((ticketId, techName) => {
        setAssignedTechnicianByTicket((prev) => ({ ...prev, [ticketId]: techName }));
        setAssignmentOpenTicketId(null);
        setAssignmentFeedback({ type: "success", message: "Ticket assigned successfully." });
        refetch();
    }, [refetch]);

    if (authLoading || (!isAuthenticated && !isAdmin)) return null;

    const selectClass = "h-11 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]";

    return (
        <section className="rounded-2xl border border-[rgba(17,24,39,0.08)] bg-white p-8 shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-grey">Admin workspace</p>
                    <h1 className="mt-3 text-[22px] font-semibold text-ink-black">All Tickets</h1>
                    <p className="mt-2 text-sm text-slate-grey">Track tickets, review details, and manage assignments.</p>
                </div>

                {assignmentFeedback.message && (
                    <div
                        role="alert"
                        className={`mt-4 rounded-[10px] border px-4 py-3 text-sm ${
                            assignmentFeedback.type === "success"
                                ? "border-[rgba(16,185,129,0.25)] bg-[#D1FAE5] text-[#065F46]"
                                : "border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] text-[#991B1B]"
                        }`}
                    >
                        {assignmentFeedback.message}
                    </div>
                )}

                <Button type="button" variant="ghost" className="h-11 px-5" onClick={() => router.back()}>
                    ← Back to dashboard
                </Button>
            </div>

            {/* Filter bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <select className={selectClass} value={statusParam}
                        onChange={(e) => pushParams({ status: e.target.value })}>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s || "ALL_STATUS"} value={s}>{s || "All statuses"}</option>
                        ))}
                    </select>

                    <select className={selectClass} value={priorityParam}
                        onChange={(e) => pushParams({ priority: e.target.value })}>
                        {PRIORITY_OPTIONS.map((p) => (
                            <option key={p || "ALL_PRIORITY"} value={p}>{p || "All priorities"}</option>
                        ))}
                    </select>

                    <select className={selectClass} value={categoryParam}
                        onChange={(e) => pushParams({ category: e.target.value })}>
                        {CATEGORY_OPTIONS.map((c) => (
                            <option key={c || "ALL_CATEGORY"} value={c}>{c || "All categories"}</option>
                        ))}
                    </select>
                </div>

                <Button type="button" variant="ghost" className="h-11 px-5" onClick={refetch} disabled={loading}>
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="mt-4 rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]">
                    {error}
                </div>
            )}

            {/* Ticket list */}
            <div className="mt-6 space-y-3">
                {loading ? (
                    <p className="text-sm text-slate-grey">Loading tickets…</p>
                ) : tickets.length === 0 ? (
                    <div className="flex min-h-55 items-center justify-center rounded-[14px] border border-[rgba(17,24,39,0.08)] bg-bright-snow px-6 text-center text-sm text-slate-grey">
                        No tickets found.
                    </div>
                ) : (
                    tickets.map((ticket) => {
                        const status      = String(ticket.status || "").toUpperCase();
                        const isAssignable = status === "ACCEPTED" || status === "NEW";
                        const assigneeName = ticket.assigneeName || assignedTechnicianByTicket[ticket.id];

                        return (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                expanded={expandedTicketId === ticket.id}
                                onToggleDetails={() =>
                                    setExpandedTicketId((prev) => (prev === ticket.id ? null : ticket.id))
                                }
                                headerRight={
                                    isAssignable
                                        ? assigneeName
                                            ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    {assigneeName}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="bg-blue-600 text-white rounded-xl px-4 py-1.5 text-xs font-bold hover:bg-blue-700 hover:shadow-md transition-all active:translate-y-0 hover:-translate-y-0.5"
                                                    onClick={() =>
                                                        setAssignmentOpenTicketId((prev) =>
                                                            prev === ticket.id ? null : ticket.id
                                                        )
                                                    }
                                                >
                                                    Assign Tech
                                                </button>
                                            )
                                        : null
                                }
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
                                                <span className="font-medium text-gray-900">{assigneeName || "Unassigned"}</span>
                                            </p>
                                            <p className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Reporter</span>
                                                <span className="font-medium text-gray-900">{ticket.authorName || ticket.createdBy || ticket.clientName || "Unknown"}</span>
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

                                {assignmentOpenTicketId === ticket.id && (
                                    <AssignmentPanel
                                        ticketId={ticket.id}
                                        onAssigned={(name) => handleAssigned(ticket.id, name)}
                                        onCancel={() => setAssignmentOpenTicketId(null)}
                                    />
                                )}
                            </TicketCard>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between gap-3">
                <Button type="button" variant="ghost"
                    disabled={pageParam === 0 || loading}
                    onClick={() => setPage(pageParam - 1)}>
                    Previous
                </Button>
                <p className="text-sm text-slate-grey">
                    Page {totalPages === 0 ? 0 : pageParam + 1} / {totalPages}
                </p>
                <Button type="button" variant="ghost"
                    disabled={!(totalPages > 0 && pageParam + 1 < totalPages) || loading}
                    onClick={() => setPage(pageParam + 1)}>
                    Next
                </Button>
            </div>
        </section>
    );
}
