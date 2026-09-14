
"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button, Textarea, Modal } from "@/components/ui";
const empty = {
    name: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    notes: "",
};

const fields: { key: string; label: string; type: string }[] = [
    { key: "name", label: "Full Name", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "age", label: "Age", type: "text" },
    { key: "dateOfBirth", label: "Date Of Birth", type: "date" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "notes", label: "Remarks", type: "textarea" },
];

export default function Patients() {
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [form, setForm] = useState<any>(empty);
    const [editing, setEditing] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const load = () => {
        fetch("/api/patients?q=" + encodeURIComponent(q))
            .then((r) => r.json())
            .then(setItems);
    };

    useEffect(() => {
        load();
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm(empty);
        setModalOpen(true);
    };

    const openEdit = (p: any) => {
        setEditing(p.id);
        setForm({
            ...p,
            age: p.age || "",
            dateOfBirth: p.dateOfBirth?.slice(0, 10) || "",
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(empty);
    };

    const save = async (e: any) => {
        e.preventDefault();

        await fetch(
            editing
                ? `/api/patients/${editing}`
                : "/api/patients",
            {
                method: editing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            }
        );

        closeModal();
        load();
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Patients
                    </h1>

                    <p className="text-sm text-slate-500">
                        Register new and manage existing patients.
                    </p>
                </div>

                <Button onClick={openNew}>
                    + New Patient
                </Button>
            </div>

            {/* Patient List */}
            <Card className="p-5">
                <div className="mb-4 flex gap-2">
                    <Input
                        placeholder="Search name, phone or patient no..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && load()
                        }
                    />

                    <Button onClick={load}>
                        Search
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">
                                    Patient No
                                </th>

                                <th className="p-3">
                                    Name
                                </th>

                                <th className="p-3">
                                    Phone
                                </th>

                                <th className="p-3">
                                    Cases
                                </th>

                                <th className="p-3"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b"
                                >
                                    <td className="p-3">
                                        {p.patientNo}
                                    </td>

                                    <td className="p-3 font-medium">
                                        {p.name}
                                    </td>

                                    <td className="p-3">
                                        {p.phone}
                                    </td>

                                    <td className="p-3">
                                        {p._count.caseHistories}
                                    </td>

                                    <td className="p-3">
                                        <button
                                            className="text-teal-700"
                                            onClick={() => openEdit(p)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Patient Form Modal */}
            <Modal
                open={modalOpen}
                title={editing ? "Update Patient" : "New Patient"}
                onClose={closeModal}
            >
                <form onSubmit={save} className="space-y-3">
                    {fields.map((f) => (
                        <div key={f.key}>
                            <Label>{f.label}</Label>

                            {f.type === "textarea" ? (
                                <Textarea
                                    value={form[f.key]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [f.key]: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <Input
                                    type={f.type}
                                    value={form[f.key]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [f.key]: e.target.value,
                                        })
                                    }
                                    required={
                                        f.key === "name" ||
                                        f.key === "phone"
                                    }
                                />
                            )}
                        </div>
                    ))}

                    <div>
                        <Label>Gender</Label>

                        <select
                            className="input"
                            value={form.gender}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    gender: e.target.value,
                                })
                            }
                        >
                            <option value="">Select</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeModal}
                        >
                            Cancel
                        </Button>

                        <Button type="submit">
                            {editing ? "Update" : "Register Patient"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
