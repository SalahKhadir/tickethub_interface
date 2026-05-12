"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/features/Sidebar";

// Derive a readable page title from the current pathname
const deriveTitle = (pathname = "") => {
    const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
    return segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const pageTitle = deriveTitle(pathname);

    return (
        <div className="min-h-screen bg-[#f9fafb]">
            <Sidebar />

            {/* Offset content by sidebar width on desktop */}
            <div className="lg:ml-64 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[rgba(17,24,39,0.08)] bg-white/90 backdrop-blur-sm px-6 lg:px-8">
                    {/* Left: logo + page title (logo hidden on desktop — visible in sidebar) */}
                    <div className="flex items-center gap-3">
                        <div className="lg:hidden flex items-center gap-2 pl-10">
                            <Image src="/TicketHub_LogoNOBG.png" alt="TicketHub" width={24} height={24} priority />
                            <span className="text-sm font-semibold text-[#111827]">TicketHub</span>
                        </div>
                        <h1 className="text-sm font-semibold text-[#111827] hidden lg:block">{pageTitle}</h1>
                    </div>

                    {/* Right: page title on mobile */}
                    <span className="text-sm font-semibold text-[#111827] lg:hidden">{pageTitle}</span>
                </header>

                {/* Page content */}
                <main className="flex-1 px-6 py-6 lg:px-8 lg:py-7">
                    <div className="mx-auto max-w-7xl w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
