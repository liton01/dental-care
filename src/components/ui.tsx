import React from "react";
export function Button({className="",variant="primary",...p}: React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?: "primary"|"secondary"}) {
  return <button className={`${variant==="primary"?"btn-primary":"btn-secondary"} ${className}`} {...p}/>;
}
export function Card({className="",...p}: React.HTMLAttributes<HTMLDivElement>) { return <div className={`card ${className}`} {...p}/>; }
export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...p}/>; }
export function Label({children}:{children:React.ReactNode}) { return <label className="label">{children}</label>; }
export function Badge({children}:{children:React.ReactNode}) { return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{children}</span>; }
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="input min-h-[80px] resize-y" {...p}/>; }
export function Modal({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:React.ReactNode}) {
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(e)=>e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
