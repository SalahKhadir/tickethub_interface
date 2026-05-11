"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    Ticket,
    Users,
    FileText,
    LogOut,
    Lock,
} from "lucide-react";

const NAV_ITEMS = [
    {
        label: "Overview",
        href: "/dashboard/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "All Tickets",
        href: "/dashboard/admin/tickets",
        icon: Ticket,
    },
    {
        label: "Technicians",
        href: "/dashboard/admin/technicians",
        icon: Users,
    },
    {
        label: "Reports",
        href: "/dashboard/admin/reports",
        icon: FileText,
    },
    {
        label: "History",
        href: "/dashboard/admin/history",
        icon: FileText,
    },
];

const isActiveItem = (pathname, href) => {
    if (href === "/dashboard/admin/dashboard") {
        return pathname === "/dashboard/admin" || pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
};

const getInitials = (name) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const handleLogout = () => {
        // Logout logic will be implemented by parent
        router.push("/login");
    };

    const role = (user?.role || "").toLowerCase();

    const handleRefresh = () => {
        if (typeof window !== "undefined") window.dispatchEvent(new Event("refreshTickets"));
    };

    return (
        <div>
            {/* Sidebar (fixed) */}
            <aside className="w-64 h-screen bg-[#111C2D] text-white flex flex-col fixed left-0 top-0 z-20">
                {/* Logo Section */}
                <div className="border-b border-[#1F2937] px-4 py-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-transparent">
                            <Image src="/TicketHub_LogoNOBG.png" alt="TicketHub" width={28} height={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Tickethub</p>
                            <p className="text-xs text-gray-400">Admin Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 py-4">
                    <div className="space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveItem(pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-gray-700 text-white" : "text-white hover:bg-gray-700"
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Info */}
                <div className="border-t border-[#1F2937] px-4 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(user?.username || user?.name || "Admin")}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.username || "Admin"}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.role || "Admin"}</p>
                    </div>
                </div>
            </aside>

            {/* Content area */}
            <div className="ml-64 flex-1 bg-gray-50 min-h-screen flex flex-col">
                {/* Top toolbar removed to avoid duplicate navbars; pages provide their own headings. */}

                {/* Page Content - centered container for better alignment */}
                <main className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="max-w-7xl w-full mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
