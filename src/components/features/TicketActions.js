"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/hooks/useAuth";
import { updateTicketStatus } from "@/services/api";

const STATUS = {
    NEW: "NEW",
    ACCEPTED: "ACCEPTED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
};

export default function TicketActions({
    ticket,
    onStatusUpdated,
    onActionComplete,
    readOnly = false,
}) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [localStatus, setLocalStatus] = useState(ticket?.status || "");
    const [solution, setSolution] = useState("");

    const currentStatus = String(ticket?.status || localStatus || "").toUpperCase();
    const userRole = String(user?.role || "").toLowerCase();
    const isAdmin = userRole === ROLES.ADMIN;
    const isTechnician = userRole === ROLES.TECHNICIAN;

    const isAssignedToMe = (() => {
        if (!ticket || !user) return false;

        const lower = (v) => (v ? String(v).toLowerCase() : "");

        const ticketAssigneeNames = [
            ticket?.assigneeName,
            ticket?.assignedToName,
            ticket?.technicianName,
            ticket?.assignedTo,
        ]
            .filter(Boolean)
            .map(lower);

        const userNames = [
            user?.fullName,
            user?.username,
            user?.email,
            user?.name,
        ]
            .filter(Boolean)
            .map(lower);

        // compare string names
        if (ticketAssigneeNames.some((a) => userNames.includes(a))) {
            return true;
        }

        // compare numeric ids
        const ticketAssigneeIds = [ticket?.assigneeId, ticket?.assignedToId, ticket?.assignedTo, ticket?.technicianId]
            .filter((v) => v !== undefined && v !== null)
            .map((v) => String(v));
        const userIds = [user?.id, user?.userId]
            .filter((v) => v !== undefined && v !== null)
            .map((v) => String(v));

        if (ticketAssigneeIds.some((id) => userIds.includes(id))) {
            return true;
        }

        return false;
    })();

    const actionConfig = useMemo(() => {
        if (currentStatus === STATUS.NEW && isAdmin && !readOnly) {
            return {
                label: "Accepter",
                nextStatus: STATUS.ACCEPTED,
            };
        }

        if (currentStatus === STATUS.IN_PROGRESS && isTechnician && isAssignedToMe && !readOnly) {
            return {
                label: "Marquer comme Résolu",
                nextStatus: STATUS.RESOLVED,
                requiresSolution: true,
            };
        }

        return null;
    }, [currentStatus, isAdmin, isTechnician, isAssignedToMe, readOnly]);

    const handleStatusUpdate = async () => {
        if (!ticket?.id || !actionConfig) {
            return;
        }

        if (actionConfig.requiresSolution && !solution.trim()) {
            setError("Une solution est obligatoire pour résoudre ce ticket.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const extraData = actionConfig.requiresSolution ? { solution } : {};
            const updatedTicket = await updateTicketStatus(
                ticket.id,
                actionConfig.nextStatus,
                extraData
            );
            const nextStatus = updatedTicket?.status || actionConfig.nextStatus;
            setLocalStatus(nextStatus);
            setSolution("");

            if (typeof onStatusUpdated === "function") {
                onStatusUpdated({
                    ...ticket,
                    ...updatedTicket,
                    status: nextStatus,
                });
            }

            if (typeof onActionComplete === "function") {
                onActionComplete();
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Impossible de mettre a jour le statut du ticket."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!actionConfig) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-blue-50/30 p-4 shadow-sm">
            {actionConfig.requiresSolution ? (
                <div className="space-y-2">
                    <label htmlFor="solution-input" className="text-sm font-semibold text-gray-700">
                        Resolution Details
                    </label>
                    <textarea
                        id="solution-input"
                        rows={3}
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="Describe the solution applied..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                </div>
            ) : null}
            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium" role="alert">
                    {error}
                </p>
            ) : null}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleStatusUpdate}
                    className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    disabled={loading || (actionConfig.requiresSolution && !solution.trim())}
                >
                    {loading ? "Updating..." : actionConfig.label}
                </button>
            </div>
        </div>
    );
}
