import React from "react";
export function Button({className="",variant="primary",...p}: React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?: "primary"|"secondary"}) {
  return <button className={`${variant==="primary"?"btn-primary":"btn-secondary"} ${className}`} {...p}/>;
}
export function Card({className="",...p}: React.HTMLAttributes<HTMLDivElement>) { return <div className={`card ${className}`} {...p}/>; }
export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...p}/>; }
export function Label({children}:{children:React.ReactNode}) { return <label className="label">{children}</label>; }
export function Badge({children}:{children:React.ReactNode}) { return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{children}</span>; }
