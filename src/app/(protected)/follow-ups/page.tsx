"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Label, Button, SearchSelect } from "@/components/ui";
import { Search, RotateCw, FolderOpen, Pencil } from "lucide-react";
import CaseFormModal from "@/components/case-form-modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const toYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fmtDate = (iso?: string | null) => {
    if (!iso) return "-";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};

const statusColors: Record<string, string> = {
    OPEN: "bg-amber-50 text-amber-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-teal-50 text-teal-700",
    CLOSED: "bg-slate-100 text-slate-600",
};

export default function FollowUps() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [patientId, setPatientId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [includePast, setIncludePast] = useState(false);
    const [editingCase, setEditingCase] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const load = (
        pid = patientId,
        from = dateFrom,
        to = dateTo,
        past = includePast
    ) => {
        const params = new URLSearchParams();
        if (pid) params.set("patientId", pid);
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);
        if (past) params.set("includePast", "1");
        fetch("/api/follow-ups?" + params.toString())
            .then((r) => r.json())
            .then((d) => setItems(Array.isArray(d) ? d : []));
    };

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then((d) => setPatients(Array.isArray(d) ? d : []));
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const todayYMD = toYMD(new Date());

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Next Follow-up</h1>

                <p className="text-sm text-slate-500">
                    Patients due for their next visit.
                </p>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="sm:w-64">
                        <Label>Patient</Label>

                        <SearchSelect
                            options={[
                                { value: "", label: "All Patients" },
                                ...patients.map((p) => ({
                                    value: String(p.id),
                                    label: `${p.name} — ${p.phone}`,
                                })),
                            ]}
                            value={patientId}
                            onChange={(v) => {
                                setPatientId(v);
                                load(v);
                            }}
                            placeholder="All Patients"
                        />
                    </div>

                    <div className="sm:w-40">
                        <Label>From</Label>

                        <DatePicker
                            selected={dateFrom ? new Date(dateFrom) : null}
                            onChange={(d: Date | null) => {
                                const v = d ? toYMD(d) : "";
                                setDateFrom(v);
                                load(patientId, v, dateTo);
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            isClearable
                        />
                    </div>

                    <div className="sm:w-40">
                        <Label>To</Label>

                        <DatePicker
                            selected={dateTo ? new Date(dateTo) : null}
                            onChange={(d: Date | null) => {
                                const v = d ? toYMD(d) : "";
                                setDateTo(v);
                                load(patientId, dateFrom, v);
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            minDate={dateFrom ? new Date(dateFrom) : undefined}
                            isClearable
                        />
                    </div>

                    <label className="flex items-center gap-1.5 pb-2 text-sm">
                        <input
                            type="checkbox"
                            checked={includePast}
                            onChange={(e) => {
                                setIncludePast(e.target.checked);
                                load(patientId, dateFrom, dateTo, e.target.checked);
                            }}
                        />
                        Include past
                    </label>

                    <Button onClick={() => load()}>
                        <Search size={16} className="mr-1.5" />
                        Search
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setPatientId("");
                            setDateFrom("");
                            setDateTo("");
                            setIncludePast(false);
                            load("", "", "", false);
                        }}
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Refresh
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Follow-up Date</th>
                                <th className="p-3">Patient</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Case</th>
                                <th className="p-3">Problem</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((c) => {
                                const due = c.followUpDate?.slice(0, 10);
                                const isToday = due === todayYMD;
                                const isPast = due < todayYMD;

                                return (
                                    <tr key={c.id} className="border-b">
                                        <td className="p-3 whitespace-nowrap font-medium">
                                            {fmtDate(c.followUpDate)}
                                            {isToday && (
                                                <span className="ml-1.5 rounded-full bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">
                                                    Today
                                                </span>
                                            )}
                                            {isPast && (
                                                <span className="ml-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                                    Overdue
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3 font-medium">
                                            {c.patient.name}
                                        </td>

                                        <td className="p-3 whitespace-nowrap">
                                            {c.patient.phone}
                                        </td>

                                        <td className="p-3 whitespace-nowrap">
                                            Case-
                                            {String(c.caseNo).padStart(2, "0")}
                                        </td>

                                        <td className="p-3 max-w-[220px] truncate" title={c.problem || ""}>
                                            {c.problem || "-"}
                                        </td>

                                        <td className="p-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    statusColors[c.status] ||
                                                    "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {c.status}
                                            </span>
                                        </td>

                                        <td className="p-3 whitespace-nowrap">
                                            <button
                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                                                onClick={() =>
                                                    router.push(
                                                        `/cases/patient/${c.patientId}`
                                                    )
                                                }
                                                title="View patient case history"
                                            >
                                                <FolderOpen size={16} />
                                            </button>

                                            <button
                                                className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50"
                                                onClick={() => {
                                                    setEditingCase(c);
                                                    setModalOpen(true);
                                                }}
                                                title="Edit case / reschedule follow-up"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No follow-ups scheduled
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CaseFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={() => load()}
                caseData={editingCase}
            />
        </div>
    );
}
