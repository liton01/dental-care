"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
    ["Dashboard", "/dashboard", "▦"],
    ["Patients", "/patients", "◉"],
    ["Case History", "/cases", "▤"],
    ["Prescriptions", "/prescriptions", "℞"],
    ["Payments & Accounting", "/payments", "৳"],
    ["Greetings", "/greetings", "✉"],
];

const securityItems = [
    ["User", "/security/users"],
    ["User Role", "/security/user-roles"],
    ["Role", "/security/roles"],
    ["Permission", "/security/permissions"],
];

export default function Sidebar() {
    const path = usePathname();

    const isSecurityActive = path.startsWith("/security");

    const [securityOpen, setSecurityOpen] =
        useState(isSecurityActive);

    return (
        <aside
            className="
                fixed
                inset-y-0
                left-0
                z-20
                hidden
                w-64
                border-r
                bg-white
                lg:flex
                lg:flex-col
            "
        >
            {/* =====================================================
                HEADER
            ====================================================== */}
            <div
                className="
                    flex
                    h-16
                    shrink-0
                    items-center
                    border-b
                    px-6
                "
            >
                <div>
                    <div className="font-bold text-teal-700">
                        Mohonto Dental Care
                    </div>

                    <div className="text-xs text-slate-500">
                        Clinic Management
                    </div>
                </div>
            </div>

            {/* =====================================================
                SCROLLABLE NAVIGATION
            ====================================================== */}
            <nav
                className="
                    sidebar-scroll
                    flex-1
                    space-y-1
                    overflow-y-auto
                    overflow-x-hidden
                    p-3
                "
            >
                {/* =================================================
                    MAIN MENUS
                ================================================== */}
                {items.map(([name, href, icon]) => {
                    const isActive = path === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                px-4
                                py-3
                                text-sm
                                transition-colors
                                ${
                                    isActive
                                        ? "bg-teal-50 font-semibold text-teal-700"
                                        : "text-slate-600 hover:bg-slate-50"
                                }
                            `}
                        >
                            <span className="w-5 text-center">
                                {icon}
                            </span>

                            <span>
                                {name}
                            </span>
                        </Link>
                    );
                })}

                {/* =================================================
                    SECURITY PARENT MENU
                ================================================== */}
                <button
                    type="button"
                    onClick={() =>
                        setSecurityOpen((current) => !current)
                    }
                    className={`
                        flex
                        w-full
                        items-center
                        justify-between
                        rounded-xl
                        px-4
                        py-3
                        text-sm
                        transition-colors
                        ${
                            isSecurityActive
                                ? "bg-teal-50 font-semibold text-teal-700"
                                : "text-slate-600 hover:bg-slate-50"
                        }
                    `}
                >
                    <span className="flex items-center gap-3">
                        <span className="w-5 text-center">
                            ⚿
                        </span>

                        <span>
                            Security
                        </span>
                    </span>

                    <span
                        className={`
                            text-xs
                            transition-transform
                            duration-200
                            ${
                                securityOpen
                                    ? "rotate-180"
                                    : ""
                            }
                        `}
                    >
                        ▼
                    </span>
                </button>

                {/* =================================================
                    SECURITY SUB MENUS
                ================================================== */}
                {securityOpen && (
                    <div
                        className="
                            ml-4
                            space-y-1
                            border-l
                            border-slate-200
                            pl-3
                        "
                    >
                        {securityItems.map(([name, href]) => {
                            const isActive = path === href;

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`
                                        flex
                                        items-center
                                        rounded-lg
                                        px-4
                                        py-2.5
                                        text-sm
                                        transition-colors
                                        ${
                                            isActive
                                                ? "bg-teal-50 font-semibold text-teal-700"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    {name}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>
        </aside>
    );
}