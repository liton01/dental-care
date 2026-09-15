"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Label, Button, SearchSelect } from "@/components/ui";
import { Plus, Search, RotateCw, Pencil, Trash2, FolderOpen } from "lucide-react";
import CaseFormModal from "@/components/case-form-modal";

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

export default function CaseHistoryList() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [patientId, setPatientId] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<any | null>(null);

    const load = (pid = patientId, query = q) => {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (pid) params.set("patientId", pid);
        fetch("/api/cases?" + params.toString())
            .then((r) => r.json())
            .then(setItems);
    };

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then(setPatients);
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refresh = () => {
        setQ("");
        setPatientId("");
        load("", "");
    };

    const openNew = () => {
        setEditingCase(null);
        setModalOpen(true);
    };

    const openEdit = (c: any) => {
        setEditingCase(c);
        setModalOpen(true);
    };

    const remove = async (c: any) => {
        if (!confirm(`Delete Case-${String(c.caseNo).padStart(2, "0")} of ${c.patient.name}?`)) return;
        await fetch(`/api/cases/${c.id}`, { method: "DELETE" });
        load();
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Case History
                    </h1>

                    <p className="text-sm text-slate-500">
                        All recorded cases in tabular form.
                    </p>
                </div>

                <Button onClick={openNew}>
                    <Plus size={16} className="mr-1.5" />
                    New Case
                </Button>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
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

                    <div className="sm:w-64">
                        <Label>Search</Label>

                        <Input
                            placeholder="Problem, treatment, tooth..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && load()
                            }
                        />
                    </div>

                    <Button onClick={() => load()}>
                        <Search size={16} className="mr-1.5" />
                        Search
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={refresh}
                        title="Reset filters and reload"
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Refresh
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Patient No</th>
                                <th className="p-3">Patient</th>
                                <th className="p-3">Case</th>
                                <th className="p-3">Tooth</th>
                                <th className="p-3">Problem</th>
                                <th className="p-3">Treatment</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Case Date</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((c) => (
                                <tr key={c.id} className="border-b">
                                    <td className="p-3">
                                        {c.patient.patientNo}
                                    </td>

                                    <td className="p-3 font-medium">
                                        {c.patient.name}
                                    </td>

                                    <td className="p-3">
                                        Case-
                                        {String(c.caseNo).padStart(2, "0")}
                                    </td>

                                    <td className="p-3">
                                        {c.toothNumber || "-"}
                                    </td>

                                    <td className="p-3 max-w-[200px] truncate" title={c.problem || ""}>
                                        {c.problem || "-"}
                                    </td>

                                    <td className="p-3 max-w-[200px] truncate" title={c.treatment || ""}>
                                        {c.treatment || "-"}
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
                                        {fmtDate(c.caseDate)}
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
                                            onClick={() => openEdit(c)}
                                            title="Edit case"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                            onClick={() => remove(c)}
                                            title="Delete case"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="p-8 text-center text-slate-500"
                                    >
                                        No cases found
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
