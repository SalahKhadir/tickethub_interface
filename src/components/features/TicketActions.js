"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/hooks/useAuth";
import { updateTicketStatus } from "@/services/api";

const STATUS = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
};

export default function TicketActions({ ticket, onStatusUpdated }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [localStatus, setLocalStatus] = useState(ticket?.status || "");

    const currentStatus = String(ticket?.status || localStatus || "").toUpperCase();
    const userRole = String(user?.role || "").toLowerCase();
    const canManageTicket =
        userRole === ROLES.ADMIN || userRole === ROLES.TECHNICIAN;

    const actionConfig = useMemo(() => {
        if (!canManageTicket) {
            return null;
        }

        if (currentStatus === STATUS.OPEN) {
            return {
                label: "Accepter",
                nextStatus: STATUS.IN_PROGRESS,
            };
        }

        if (currentStatus === STATUS.IN_PROGRESS) {
            return {
                label: "Marquer comme Résolu",
                nextStatus: STATUS.RESOLVED,
            };
        }

        return null;
    }, [canManageTicket, currentStatus]);

    const handleStatusUpdate = async () => {
        if (!ticket?.id || !actionConfig) {
            return;
        }

        setError("");
        setLoading(true);

        try {
            const updatedTicket = await updateTicketStatus(ticket.id, actionConfig.nextStatus);
            const nextStatus = updatedTicket?.status || actionConfig.nextStatus;
            setLocalStatus(nextStatus);

            if (typeof onStatusUpdated === "function") {
                onStatusUpdated({
                    ...ticket,
                    ...updatedTicket,
                    status: nextStatus,
                });
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
        <div className="space-y-2">
            {error ? (
                <p className="text-sm text-strawberry-red" role="alert">
                    {error}
                </p>
            ) : null}
            <Button type="button" onClick={handleStatusUpdate} disabled={loading}>
                {loading ? "Mise a jour..." : actionConfig.label}
            </Button>
        </div>
    );
}
