"use client";
import { signOut } from "next-auth/react";
export default function Topbar(){return <header className="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5 lg:left-64"><div><div className="font-semibold">Mohonto Dental Care</div><div className="text-xs text-slate-500">Dental Clinic Management System</div></div><button className="btn-secondary" onClick={()=>signOut({callbackUrl:"/login"})}>Sign out</button></header>}
