export interface Ticket {
    id: number;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    slaDeadline?: string;
    assigneeName?: string;
    assignedTo?: any;
    createdBy?: string;
    clientName?: string;
    // New property from backend
    creatorName?: string;
}
