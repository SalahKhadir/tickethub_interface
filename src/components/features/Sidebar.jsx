"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Ticket,
    Users,
    FileText,
    History,
    PlusCircle,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import DashboardLogoutButton from "@/components/features/DashboardLogoutButton";

const NAV_BY_ROLE = {
    [ROLES.ADMIN]: [
        { label: "Dashboard",    href: ROUTES.ADMIN,              icon: LayoutDashboard },
        { label: "Tickets",      href: ROUTES.ADMIN_TICKETS,      icon: Ticket },
        { label: "Technicians",  href: "/dashboard/admin/technicians", icon: Users },
        { label: "Reports",      href: "/dashboard/admin/reports", icon: FileText },
        { label: "History",      href: "/dashboard/admin/history", icon: History },
    ],
    [ROLES.TECHNICIAN]: [
        { label: "Assigned Tickets", href: ROUTES.TECHNICIAN_TICKETS, icon: Ticket },
        { label: "Profile",          href: ROUTES.TECHNICIAN,          icon: Users },
    ],
    [ROLES.CLIENT]: [
        { label: "My Tickets",  href: ROUTES.CLIENT_TICKETS,     icon: Ticket },
        { label: "New Ticket",  href: ROUTES.CLIENT_NEW_TICKET,  icon: PlusCircle },
    ],
};

const PORTAL_LABEL = {
    [ROLES.ADMIN]:      "Admin Portal",
    [ROLES.TECHNICIAN]: "Technician Portal",
    [ROLES.CLIENT]:     "Client Portal",
};

const isActive = (pathname, href) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

const getInitials = (name = "") =>
    name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    const role = String(user?.role || "").toLowerCase();
    const navItems = NAV_BY_ROLE[role] ?? [];
    const portalLabel = PORTAL_LABEL[role] ?? "Portal";
    const displayName = user?.username || user?.fullName || user?.name || "User";

    const sidebarContent = (
        <aside className="w-64 h-screen bg-[#111C2D] text-white flex flex-col">
            {/* Logo */}
            <div className="border-b border-[#1F2937] px-4 py-5 flex items-center gap-2.5">
                <Image src="/TicketHub_LogoNOBG.png" alt="TicketHub" width={28} height={28} priority />
                <div>
                    <p className="text-sm font-semibold text-white leading-tight">TicketHub</p>
                    <p className="text-xs text-gray-400 leading-tight">{portalLabel}</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                active
                                    ? "bg-[#1F2937] text-white"
                                    : "text-gray-300 hover:bg-[#1F2937] hover:text-white"
                            }`}
                        >
                            <Icon size={17} className="shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="border-t border-[#1F2937] px-4 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(displayName)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 capitalize truncate">{role}</p>
                </div>
                <DashboardLogoutButton />
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop: fixed sidebar */}
            <div className="hidden lg:flex fixed left-0 top-0 z-30 h-screen">
                {sidebarContent}
            </div>

            {/* Mobile: hamburger trigger */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-[#111C2D] text-white shadow-lg"
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>

            {/* Mobile: overlay drawer */}
            {open && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 z-40 bg-black/50"
                        onClick={() => setOpen(false)}
                    />
                    <div className="lg:hidden fixed left-0 top-0 z-50 h-screen">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-[-40px] z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                                aria-label="Close menu"
                            >
                                <X size={16} />
                            </button>
                            {sidebarContent}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
