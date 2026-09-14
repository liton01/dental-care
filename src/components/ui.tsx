import React from "react";
import { X } from "lucide-react";
export function Button({className="",variant="primary",...p}: React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?: "primary"|"secondary"}) {
  return <button className={`${variant==="primary"?"btn-primary":"btn-secondary"} ${className}`} {...p}/>;
}
export function Card({className="",...p}: React.HTMLAttributes<HTMLDivElement>) { return <div className={`card ${className}`} {...p}/>; }
export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...p}/>; }
export function Label({children}:{children:React.ReactNode}) { return <label className="label">{children}</label>; }
export function Badge({children}:{children:React.ReactNode}) { return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{children}</span>; }
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="input min-h-[80px] resize-y" {...p}/>; }
export function SearchSelect({
  options, value, onChange, placeholder = "Search...", required,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <input
        className="input"
        placeholder={placeholder}
        value={open ? query : selected?.label ?? ""}
        onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        required={required && !value}
      />
      {open && (
        <div className="absolute z-40 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-teal-50 ${o.value === value ? "bg-teal-50 font-medium text-teal-700" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
            >
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No match found</div>
          )}
        </div>
      )}
    </div>
  );
}
export function Modal({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:React.ReactNode}) {
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(e)=>e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
