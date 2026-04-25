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
    { value: "URGENT", label: "Urgent" },
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
        <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-ink-black">Declare a ticket</h3>
            <p className="mt-2 text-sm text-slate-grey">
                Provide details about your issue and our team will handle it quickly.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-black placeholder:text-slate-grey focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
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
                            className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
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
                            className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-ink-black focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30"
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
                    <div className="rounded-xl border border-strawberry-red/30 bg-strawberry-red/10 px-4 py-3 text-sm text-strawberry-red">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                        {success}
                    </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Create ticket"}
                </Button>
            </form>
        </section>
    );
}