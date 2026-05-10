import Link from "next/link";
import TicketForm from "@/components/features/TicketForm";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "New Ticket | TicketHub",
};

export default function NewTicketPage() {
    return (
        <div className="max-w-3xl mx-auto w-full pt-8 pb-12">
            <div className="mb-6">
                <Link
                    href={ROUTES.CLIENT}
                    prefetch={false}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </Link>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-[rgba(17,24,39,0.08)] overflow-hidden">
                <div className="bg-[#0F172A] px-8 py-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h2 className="text-2xl font-bold text-white relative z-10">Declare a new ticket</h2>
                    <p className="text-blue-200 mt-2 text-sm relative z-10">Please provide detailed information about your issue and our team will handle it quickly.</p>
                </div>
                <div className="p-8">
                    <TicketForm />
                </div>
            </div>
        </div>
    );
}
