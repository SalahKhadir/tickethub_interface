"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { ROLES } from "@/constants/roles";
import TechnicianTicketsTable from "@/components/features/TechnicianTicketsTable";
import { History } from "lucide-react";

export default function TechnicianHistoryPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [page, setPage] = useState(0);

    const isTechnician = String(user?.role || "").toLowerCase() === ROLES.TECHNICIAN;

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !isTechnician) router.replace("/login");
    }, [authLoading, isAuthenticated, isTechnician, router]);

    const { data, loading, error } = useFetch(
        `/api/tickets?page=${page}&status=RESOLVED,CLOSED`,
        { fallbackUrls: [`/api/tickets?page=${page}`] }
    );

    const tickets    = Array.isArray(data?.content) ? data.content : [];
    const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 0;

    if (authLoading || (!isAuthenticated && !isTechnician)) return null;

    return (
        <div className="min-h-screen bg-bright-snow p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    <History size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Ticket History</h1>
                    <p className="text-xs text-gray-400 mt-0.5">All resolved and closed tickets assigned to you</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-gray-400">Loading history…</p>
            ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="text-4xl mb-3">📭</span>
                    <p className="text-sm">No resolved tickets yet.</p>
                </div>
            ) : (
                <TechnicianTicketsTable
                    tickets={tickets}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
