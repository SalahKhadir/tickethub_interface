"use client";

import { useEffect, useState } from "react";
import { getAdminGlobalStats } from "@/services/api";
import { Timer, Ticket, CheckCircle2, Clock, AlertTriangle, RefreshCw, Users } from "lucide-react";

const CATEGORY_LABELS = ["NETWORK", "SOFTWARE", "HARDWARE", "SECURITY", "ACCESS", "OTHER"];
const STATUS_LABELS   = ["NEW", "ACCEPTED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_LABELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const STATUS_COLORS = {
    NEW:         "bg-blue-500",
    ACCEPTED:    "bg-indigo-500",
    IN_PROGRESS: "bg-amber-500",
    RESOLVED:    "bg-green-500",
    CLOSED:      "bg-gray-400",
};

const PRIORITY_COLORS = {
    LOW:      "bg-blue-300",
    MEDIUM:   "bg-yellow-400",
    HIGH:     "bg-orange-500",
    CRITICAL: "bg-red-500",
};

const CATEGORY_COLORS = [
    "bg-violet-500", "bg-blue-500", "bg-amber-500",
    "bg-red-500",    "bg-green-500", "bg-gray-400",
];

const DEFAULT_STATS = {
    totalTickets:      0,
    openTickets:       0,
    resolvedToday:     0,
    criticalSLA:       0,
    totalUsers:        0,
    avgResolutionTime: null,
    ticketsByCategory: {},
};

function KpiCard({ icon: Icon, label, value, iconBg, iconColor, loading }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? <span className="text-gray-300">…</span> : value}
                </p>
            </div>
            <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
                <Icon size={22} />
            </div>
        </div>
    );
}

function BarChart({ data, labels, colors, loading }) {
    const max = Math.max(...labels.map((l) => data[l] ?? 0), 1);
    return (
        <div className="space-y-3">
            {labels.map((label, i) => {
                const val = data[label] ?? 0;
                const pct = Math.round((val / max) * 100);
                const color = Array.isArray(colors) ? colors[i % colors.length] : colors[label] ?? "bg-blue-500";
                return (
                    <div key={label} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs font-medium text-gray-600 uppercase tracking-wide truncate">
                            {label}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${color} ${loading ? "animate-pulse" : ""}`}
                                style={{ width: loading ? "30%" : `${pct}%` }}
                            />
                        </div>
                        <span className="w-8 text-right text-xs font-bold text-gray-700">
                            {loading ? "…" : val}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function AdminReportsPage() {
    const [stats, setStats]     = useState(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const load = () => {
        setLoading(true);
        setError("");
        getAdminGlobalStats()
            .then((data) => {
                setStats({ ...DEFAULT_STATS, ...data });
                setLastUpdated(new Date());
            })
            .catch((err) => {
                setError(err?.response?.data?.message || err?.message || "Unable to load stats.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Global ticket statistics — live from the backend
                        {lastUpdated && (
                            <span className="ml-2 text-gray-400">
                                · Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-50"
                >
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard icon={Ticket}        label="Total Tickets"   value={stats.totalTickets}  iconBg="bg-blue-50"   iconColor="text-blue-600"   loading={loading} />
                <KpiCard icon={Clock}         label="Open / Active"   value={stats.openTickets}   iconBg="bg-amber-50"  iconColor="text-amber-600"  loading={loading} />
                <KpiCard icon={CheckCircle2}  label="Resolved Today"  value={stats.resolvedToday} iconBg="bg-green-50"  iconColor="text-green-600"  loading={loading} />
                <KpiCard icon={AlertTriangle} label="Critical SLA"    value={stats.criticalSLA}   iconBg="bg-red-50"    iconColor="text-red-600"    loading={loading} />
                <KpiCard icon={Users}         label="Total Users"     value={stats.totalUsers}    iconBg="bg-indigo-50" iconColor="text-indigo-600" loading={loading} />
                <KpiCard icon={Timer}         label="Avg Resolution"  value={stats.avgResolutionTime ?? "N/A"} iconBg="bg-purple-50" iconColor="text-purple-600" loading={loading} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* By Category */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Tickets by Category</h2>
                    <BarChart
                        data={stats.ticketsByCategory}
                        labels={CATEGORY_LABELS}
                        colors={CATEGORY_COLORS}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
