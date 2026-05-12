"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { createTicket } from "@/services/api";

const PRIORITY_OPTIONS = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
];

const CATEGORY_OPTIONS = [
    { value: "NETWORK", label: "Network" },
    { value: "HARDWARE", label: "Hardware" },
    { value: "SOFTWARE", label: "Software" },
    { value: "ACCESS", label: "Access" },
];

export default function TicketForm() {
    const router = useRouter();
    const [formState, setFormState] = useState({
        title: "",
        description: "",
        priority: PRIORITY_OPTIONS[1].value,
        category: CATEGORY_OPTIONS[0].value,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await createTicket(formState);
            setSuccess("Ticket created successfully. Redirecting to dashboard...");
            setFormState({
                title: "",
                description: "",
                priority: PRIORITY_OPTIONS[1].value,
                category: CATEGORY_OPTIONS[0].value,
            });
            setTimeout(() => {
                router.push(ROUTES.CLIENT);
            }, 1000);
        } catch (err) {
            const status = err?.response?.status;
            const backendDetails =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.response?.data?.details ||
                "";
            setError(
                backendDetails
                    ? `Unable to create ticket (HTTP ${status || "?"}): ${backendDetails}`
                    : err?.message || "Unable to create ticket. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Title"
                    name="title"
                    value={formState.title}
                    onChange={handleChange}
                    placeholder="Short summary of your issue"
                    required
                />

                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="description"
                        className="text-sm font-medium text-ink-black"
                    >
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formState.description}
                        onChange={handleChange}
                        placeholder="Describe the issue in detail"
                        rows={5}
                        className="rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 py-3 text-sm text-ink-black placeholder:text-slate-grey focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                        required
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="priority"
                            className="text-sm font-medium text-ink-black"
                        >
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formState.priority}
                            onChange={handleChange}
                            className="h-11 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                            required
                        >
                            {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="category"
                            className="text-sm font-medium text-ink-black"
                        >
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formState.category}
                            onChange={handleChange}
                            className="h-11 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                            required
                        >
                            {CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="rounded-[10px] border border-[rgba(16,185,129,0.25)] bg-[#D1FAE5] px-4 py-3 text-sm text-[#065F46]">
                        {success}
                    </div>
                ) : null}

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-medium text-sm px-4 py-3 rounded-xl transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                Submitting...
                            </>
                        ) : "Submit Ticket"}
                    </button>
                </div>
            </form>
        </section>
    );
}