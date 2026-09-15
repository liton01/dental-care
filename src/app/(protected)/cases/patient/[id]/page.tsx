"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
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

export default function PatientCaseHistory() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<any | null>(null);

    const load = () =>
        fetch(`/api/cases?patientId=${id}`)
            .then((r) => r.json())
            .then(setItems);

    useEffect(() => {
        fetch(`/api/patients/${id}`)
            .then((r) => r.json())
            .then(setPatient);
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const openNew = () => {
        setEditingCase(null);
        setModalOpen(true);
    };

    const openEdit = (c: any) => {
        setEditingCase(c);
        setModalOpen(true);
    };

    const remove = async (c: any) => {
        if (!confirm(`Delete Case-${String(c.caseNo).padStart(2, "0")}?`)) return;
        await fetch(`/api/cases/${c.id}`, { method: "DELETE" });
        load();
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Case History
                        {patient ? ` — ${patient.name}` : ""}
                    </h1>

                    <p className="text-sm text-slate-500">
                        {patient
                            ? `${patient.patientNo} · ${patient.phone}`
                            : "Loading patient..."}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => router.push("/cases/list")}
                    >
                        <ArrowLeft size={16} className="mr-1.5" />
                        Back to List
                    </Button>

                    <Button onClick={openNew}>
                        <Plus size={16} className="mr-1.5" />
                        New Case
                    </Button>
                </div>
            </div>

            <Card className="p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((c) => (
                        <div key={c.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-semibold text-teal-700">
                                    Case-
                                    {String(c.caseNo).padStart(2, "0")}
                                </span>

                                <div className="flex items-center gap-1">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            statusColors[c.status] ||
                                            "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {c.status}
                                    </span>

                                    <button
                                        className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50"
                                        onClick={() => openEdit(c)}
                                        title="Edit case"
                                    >
                                        <Pencil size={15} />
                                    </button>

                                    <button
                                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                        onClick={() => remove(c)}
                                        title="Delete case"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-2 text-sm">
                                <b>Tooth:</b> {c.toothNumber || "—"}
                            </p>

                            <p className="text-sm">
                                <b>Problem:</b> {c.problem || "—"}
                            </p>

                            <p className="text-sm">
                                <b>Treatment:</b> {c.treatment || "—"}
                            </p>

                            {c.details && (
                                <p className="text-sm">
                                    <b>Remarks:</b> {c.details}
                                </p>
                            )}

                            <p className="mt-2 text-xs text-slate-500">
                                {fmtDate(c.caseDate)}
                            </p>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-500">
                            No case history yet for this patient
                        </div>
                    )}
                </div>
            </Card>

            <CaseFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={() => load()}
                caseData={editingCase}
                fixedPatientId={String(id)}
            />
        </div>
    );
}
