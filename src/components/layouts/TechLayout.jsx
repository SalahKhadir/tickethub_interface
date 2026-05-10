"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { LayoutDashboard, Ticket, BarChart3, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard/technician", icon: LayoutDashboard },
    { label: "My Tickets", href: "/technician/tickets", icon: Ticket, badge: true },
    { label: "Performance Stats", href: "#", icon: BarChart3 },
    { label: "Settings", href: "#", icon: Settings },
];

const isActiveItem = (pathname, href) => {
    if (href === "/dashboard/technician") {
        return pathname === href || pathname === "/dashboard/technician/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
};

const getInitials = (value) => {
    if (!value) return "?";
    return value
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

export default function TechLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const { data } = useFetch("/api/tickets?page=0&status=IN_PROGRESS", {
        fallbackUrls: [],
    });

    const assignedCount = useMemo(() => {
        const total = data?.totalElements;
        return typeof total === "number" ? total : 0;
    }, [data]);

    const handleLogout = () => router.push("/login");

    const role = (user?.role || "").toLowerCase();

    const handleRefresh = () => {
        if (typeof window !== "undefined") window.dispatchEvent(new Event("refreshTickets"));
    };

    return (
        <div>
            {/* Sidebar (fixed) */}
            <aside className="w-64 h-screen bg-[#111C2D] text-white flex flex-col fixed left-0 top-0 z-20">
                {/* Logo Section */}
                <div className="border-b border-[#1F2937] px-4 py-6 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Image src="/TicketHub_LogoNOBG.png" alt="TicketHub" width={28} height={28} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Tickethub</p>
                        <p className="text-xs text-gray-400">Technician Portal</p>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 py-4">
                    <div className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveItem(pathname, item.href);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition ${active ? "bg-gray-700 text-white" : "text-white hover:bg-gray-700"}`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                    {item.badge ? (
                                        <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                                            {assignedCount}
                                        </span>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User */}
                <div className="border-t border-[#1F2937] px-4 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(user?.username || user?.name || "Tech")}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.username || user?.name || "Technician"}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.role || "Technician"}</p>
                    </div>
                </div>
            </aside>

            {/* Content area */}
            <div className="ml-64 flex-1 bg-gray-50 min-h-screen flex flex-col">
                <main className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="max-w-7xl w-full mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
