"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button, Modal } from "@/components/ui";
import { Plus, Search, X, Save, Pencil, Trash2, RotateCw } from "lucide-react";

const fmtDate = (iso?: string | null) => {
    if (!iso) return "-";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};

const DOSAGE_FORMS = [
    "Tablet", "Capsule", "Suspension", "Syrup", "Gel", "Oral Gel",
    "Oral Paste", "Oral Suspension", "Mouthwash", "Injection",
    "Gargle/Solution", "Solution",
];

const empty = {
    name: "",
    strength: "",
    unit: "",
    dosageForm: "",
    manufacturerType: "Local/Imported",
    treatmentUse: "",
};

export default function Medicines() {
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [f, setF] = useState<any>(empty);
    const [editing, setEditing] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const load = (query = q) => {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        fetch("/api/medicines?" + params.toString())
            .then((r) => r.json())
            .then((d) => setItems(Array.isArray(d) ? d : []));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openNew = () => {
        setEditing(null);
        setF(empty);
        setModalOpen(true);
    };

    const openEdit = (m: any) => {
        setEditing(m.id);
        setF({
            name: m.name || "",
            strength: m.strength || "",
            unit: m.unit || "",
            dosageForm: m.dosageForm || "",
            manufacturerType: m.manufacturerType || "",
            treatmentUse: m.treatmentUse || "",
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setF(empty);
    };

    const save = async (e: any) => {
        e.preventDefault();

        await fetch(
            editing ? `/api/medicines/${editing}` : "/api/medicines",
            {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            }
        );

        closeModal();
        load();
    };

    const remove = async (m: any) => {
        if (!confirm(`Delete "${m.name} ${m.strength || ""} ${m.unit || ""}"?`)) return;
        await fetch(`/api/medicines/${m.id}`, { method: "DELETE" });
        load();
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Medicines</h1>

                    <p className="text-sm text-slate-500">
                        Medicine master list used in prescriptions.
                    </p>
                </div>

                <Button onClick={openNew}>
                    <Plus size={16} className="mr-1.5" />
                    Add New Medicine
                </Button>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="sm:w-80">
                        <Label>Search</Label>

                        <Input
                            placeholder="Name, dosage form or treatment..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                        />
                    </div>

                    <Button onClick={() => load()}>
                        <Search size={16} className="mr-1.5" />
                        Search
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setQ("");
                            load("");
                        }}
                        title="Reset search and reload"
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Refresh
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Medicine Name</th>
                                <th className="p-3">Strength</th>
                                <th className="p-3">Unit</th>
                                <th className="p-3">Dosage Form</th>
                                <th className="p-3">Manufacturer Type</th>
                                <th className="p-3">Treatment/Use</th>
                                <th className="p-3">Created</th>
                                <th className="p-3">Updated</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((m) => (
                                <tr key={m.id} className="border-b">
                                    <td className="p-3 font-medium">
                                        {m.name}
                                    </td>

                                    <td className="p-3">{m.strength || "-"}</td>
                                    <td className="p-3">{m.unit || "-"}</td>
                                    <td className="p-3">{m.dosageForm || "-"}</td>
                                    <td className="p-3">{m.manufacturerType || "-"}</td>

                                    <td className="p-3 max-w-[220px] truncate" title={m.treatmentUse || ""}>
                                        {m.treatmentUse || "-"}
                                    </td>

                                    <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                                        {fmtDate(m.createdDate)}
                                        {m.createdBy ? ` · ${m.createdBy}` : ""}
                                    </td>

                                    <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                                        {m.updatedBy
                                            ? `${fmtDate(m.updatedDate)} · ${m.updatedBy}`
                                            : "-"}
                                    </td>

                                    <td className="p-3 whitespace-nowrap">
                                        <button
                                            className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50"
                                            onClick={() => openEdit(m)}
                                            title="Edit medicine"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                            onClick={() => remove(m)}
                                            title="Delete medicine"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-500">
                                        No medicines found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                open={modalOpen}
                title={editing ? "Update Medicine" : "Add New Medicine"}
                onClose={closeModal}
            >
                <form
                    onSubmit={save}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    <div className="sm:col-span-2">
                        <Label>Medicine Name</Label>

                        <Input
                            value={f.name}
                            onChange={(e) =>
                                setF({ ...f, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label>Strength</Label>

                        <Input
                            value={f.strength}
                            onChange={(e) =>
                                setF({ ...f, strength: e.target.value })
                            }
                            placeholder="e.g. 500 or 0.12"
                        />
                    </div>

                    <div>
                        <Label>Unit</Label>

                        <Input
                            value={f.unit}
                            onChange={(e) =>
                                setF({ ...f, unit: e.target.value })
                            }
                            placeholder="e.g. mg, mg/5 mL, %"
                        />
                    </div>

                    <div>
                        <Label>Dosage Form</Label>

                        <select
                            className="input"
                            value={f.dosageForm}
                            onChange={(e) =>
                                setF({ ...f, dosageForm: e.target.value })
                            }
                        >
                            <option value="">Select</option>

                            {DOSAGE_FORMS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Manufacturer Type</Label>

                        <select
                            className="input"
                            value={f.manufacturerType}
                            onChange={(e) =>
                                setF({
                                    ...f,
                                    manufacturerType: e.target.value,
                                })
                            }
                        >
                            <option value="">Select</option>
                            <option>Local/Imported</option>
                            <option>Local</option>
                            <option>Imported</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <Label>Treatment/Use</Label>

                        <Input
                            value={f.treatmentUse}
                            onChange={(e) =>
                                setF({ ...f, treatmentUse: e.target.value })
                            }
                            placeholder="e.g. Dental pain/fever"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeModal}
                        >
                            <X size={16} className="mr-1.5" />
                            Cancel
                        </Button>

                        <Button type="submit">
                            <Save size={16} className="mr-1.5" />
                            {editing ? "Update" : "Save Medicine"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
