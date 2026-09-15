"use client";
import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";

export default function Topbar({
    collapsed,
    onToggleSidebar,
    org,
}: {
    collapsed: boolean;
    onToggleSidebar: () => void;
    org?: any;
}) {
    return (
        <header
            className={`fixed right-0 top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 transition-all duration-200 left-0 ${
                collapsed ? "" : "lg:left-64"
            }`}
        >
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>

                <div>
                    <div className="font-semibold">
                        {org?.nameEn || "Mohonto Dental Care"}
                    </div>

                    <div className="text-xs text-slate-500">
                        {org?.slogan || "Dental Clinic Management System"}
                    </div>
                </div>
            </div>

            <button
                className="btn-secondary"
                onClick={() => signOut({ callbackUrl: "/login" })}
            >
                <LogOut size={16} className="mr-1.5" />
                Sign out
            </button>
        </header>
    );
}
