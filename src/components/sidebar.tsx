"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items=[["Dashboard","/dashboard","▦"],["Patients","/patients","◉"],["Case History","/cases","▤"],["Prescriptions","/prescriptions","℞"],["Payments & Accounting","/payments","৳"],["Greetings","/greetings","✉"],["Security","/security","⚿"]];
export default function Sidebar(){const path=usePathname();return <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-white lg:block"><div className="flex h-16 items-center border-b px-6"><div><div className="font-bold text-teal-700">Mohonto Dental Care</div><div className="text-xs text-slate-500">Clinic Management</div></div></div><nav className="space-y-1 p-3">{items.map(([name,href,icon])=><Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${path===href?"bg-teal-50 font-semibold text-teal-700":"text-slate-600 hover:bg-slate-50"}`}><span>{icon}</span>{name}</Link>)}</nav></aside>}
