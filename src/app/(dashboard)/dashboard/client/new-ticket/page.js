import Link from "next/link";
import TicketForm from "@/components/features/TicketForm";
import { ROUTES } from "@/constants/routes";

export const metadata = {
    title: "New Ticket | TicketHub",
};

export default function NewTicketPage() {
    return (
        <div className="space-y-4">
            <Link
                href={ROUTES.CLIENT}
                prefetch={false}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink-black/80 transition hover:text-electric-sapphire"
            >
                Back to client dashboard
            </Link>
            <TicketForm />
        </div>
    );
}
