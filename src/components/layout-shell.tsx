"use client";
import { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import Footer from "./footer";

export default function LayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    // desktop: collapsed hides the sidebar and content takes full width
    const [collapsed, setCollapsed] = useState(false);

    // mobile: sidebar slides in as an overlay drawer
    const [mobileOpen, setMobileOpen] = useState(false);

    // organization branding, loaded from the database
    const [org, setOrg] = useState<any>(null);

    useEffect(() => {
        fetch("/api/organization/active")
            .then((r) => r.json())
            .then(setOrg)
            .catch(() => {});
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth >= 1024) {
            setCollapsed((c) => !c);
        } else {
            setMobileOpen((o) => !o);
        }
    };

    return (
        <>
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onNavigate={() => setMobileOpen(false)}
                org={org}
            />

            {/* mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Topbar
                collapsed={collapsed}
                onToggleSidebar={toggleSidebar}
                org={org}
            />

            <main
                className={`min-h-screen pt-16 transition-all duration-200 ${
                    collapsed ? "" : "lg:ml-64"
                }`}
            >
                <div className="flex min-h-[calc(100vh-4rem)] flex-col p-4 md:p-6">
                    <div className="flex-1">{children}</div>

                    <Footer />
                </div>
            </main>
        </>
    );
}
