"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { getTickets } from "@/services/api";

const STATUSES = {
    NEW: "NEW",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
};

const STATUS_CARDS = [
    {
        label: "New",
        value: STATUSES.NEW,
        activeClass: "border-violet-400/60 bg-violet-100/70",
    },
    {
        label: "In Progress",
        value: STATUSES.IN_PROGRESS,
        activeClass: "border-blue-400/60 bg-blue-100/70",
    },
    {
        label: "Resolved",
        value: STATUSES.RESOLVED,
        activeClass: "border-emerald-400/60 bg-emerald-100/70",
    },
    {
        label: "Closed",
        value: STATUSES.CLOSED,
        activeClass: "border-slate-400/60 bg-slate-200/70",
    },
];

export default function ClientDashboardPanel() {
    const [statusStats, setStatusStats] = useState({
        NEW: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [totalElements, setTotalElements] = useState(0);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const pageData = await getTickets({
                page: 0,
                status: statusFilter || undefined,
            });

            setTotalElements(
                typeof pageData?.totalElements === "number" ? pageData.totalElements : 0
            );

            const counts = {
                NEW: 0,
                IN_PROGRESS: 0,
                RESOLVED: 0,
                CLOSED: 0,
            };

            (Array.isArray(pageData?.content) ? pageData.content : []).forEach((ticket) => {
                const status = String(ticket?.status || "").toUpperCase();
                if (Object.hasOwn(counts, status)) {
                    counts[status] += 1;
                }
            });

            setStatusStats(counts);
        } catch (err) {
            const backendMessage =
                err?.response?.data?.message || err?.response?.data?.error || "";
            setError(backendMessage || "Unable to load your tickets.");
            setTotalElements(0);
            setStatusStats({
                NEW: 0,
                IN_PROGRESS: 0,
                RESOLVED: 0,
                CLOSED: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleStatusCardClick = (status) => {
        setStatusFilter((prev) => (prev === status ? "" : status));
    };

    const activeStatusLabel = useMemo(() => {
        if (!statusFilter) {
            return "All statuses";
        }
        return statusFilter;
    }, [statusFilter]);

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-grey">
                            Client workspace
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-ink-black">Client portal</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-grey">
                            Track incidents, monitor progress, and submit new service requests in one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={ROUTES.CLIENT_NEW_TICKET}
                            prefetch={false}
                            className="inline-flex h-11 items-center justify-center rounded-full bg-electric-sapphire px-6 text-sm font-semibold text-bright-snow transition hover:bg-bright-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-sapphire/40"
                        >
                            Create a new ticket
                        </Link>
                        <Link
                            href={ROUTES.CLIENT_TICKETS}
                            prefetch={false}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-black/15 bg-white px-6 text-sm font-semibold text-ink-black transition hover:border-electric-sapphire focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-sapphire/40"
                        >
                            Suivi des tickets
                        </Link>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-xl border border-black/10 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-grey">
                            Total tickets
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-ink-black">{totalElements}</p>
                    </div>
                    {STATUS_CARDS.map((item) => {
                        const isActive = statusFilter === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => handleStatusCardClick(item.value)}
                                className={`rounded-xl border p-4 text-left transition ${isActive
                                    ? item.activeClass
                                    : "border-black/10 bg-white hover:border-electric-sapphire"
                                    }`}
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-grey">
                                    {item.label}
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-ink-black">
                                    {statusStats[item.value]}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 rounded-xl border border-black/10 bg-smoke-silver/30 px-4 py-3 text-sm text-ink-black">
                    <span className="font-semibold">Active filter:</span> {activeStatusLabel}
                    <span className="mx-2 text-slate-grey">|</span>
                    <span className="font-semibold">Matching tickets:</span> {totalElements}
                </div>

                {error ? (
                    <div className="mt-4 rounded-xl border border-strawberry-red/30 bg-strawberry-red/10 px-4 py-3 text-sm text-strawberry-red">
                        {error}
                    </div>
                ) : null}
            </section>

            {loading ? (
                <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-slate-grey shadow-sm">
                    Updating dashboard metrics...
                </div>
            ) : null}
        </div>
    );
}
