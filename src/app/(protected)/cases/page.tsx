"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Input, Label, Button, Textarea, Modal } from "@/components/ui";
import { Plus, X, Save, List } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const toYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const empty = {
    patientId: "",
    caseNo: "1",
    toothNumber: "",
    problem: "",
    treatment: "",
    details: "",
    caseDate: "",
};

export default function Cases() {
    const [patients, setPatients] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [f, setF] = useState<any>(empty);
    const [modalOpen, setModalOpen] = useState(false);

    const load = () =>
        fetch("/api/cases")
            .then((r) => r.json())
            .then(setItems);

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then(setPatients);
        load();
    }, []);

    const openNew = () => {
        setF({ ...empty, caseDate: toYMD(new Date()) });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setF(empty);
    };

    const save = async (e: any) => {
        e.preventDefault();

        await fetch("/api/cases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(f),
        });

        closeModal();
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
                        Record and review patient dental cases.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Link href="/cases/list" className="btn-secondary">
                        <List size={16} className="mr-1.5" />
                        Case List
                    </Link>

                    <Button onClick={openNew}>
                        <Plus size={16} className="mr-1.5" />
                        New Case
                    </Button>
                </div>
            </div>

            {/* Case cards */}
            <Card className="p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((c) => (
                        <div
                            key={c.id}
                            className="rounded-xl border p-4"
                        >
                            <div className="flex justify-between">
                                <b>{c.patient.name}</b>

                                <span className="text-xs text-teal-700">
                                    Case-
                                    {String(c.caseNo).padStart(2, "0")}
                                </span>
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

                            <p className="mt-2 text-xs text-slate-500">
                                {new Date(c.caseDate).toLocaleDateString("en-GB")}
                            </p>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-500">
                            No case history yet
                        </div>
                    )}
                </div>
            </Card>

            {/* New Case Modal */}
            <Modal
                open={modalOpen}
                title="New Case History"
                onClose={closeModal}
            >
                <form
                    onSubmit={save}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    <div>
                        <Label>Patient</Label>

                        <select
                            className="input"
                            value={f.patientId}
                            onChange={(e) =>
                                setF({ ...f, patientId: e.target.value })
                            }
                            required
                        >
                            <option value="">Select patient</option>

                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {p.phone}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Case</Label>

                        <select
                            className="input"
                            value={f.caseNo}
                            onChange={(e) =>
                                setF({ ...f, caseNo: e.target.value })
                            }
                        >
                            {[1, 2, 3, 4].map((n) => (
                                <option key={n} value={n}>
                                    Case-{String(n).padStart(2, "0")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Tooth Number</Label>

                        <Input
                            value={f.toothNumber}
                            onChange={(e) =>
                                setF({ ...f, toothNumber: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <Label>Case Date</Label>

                        <DatePicker
                            selected={
                                f.caseDate ? new Date(f.caseDate) : null
                            }
                            onChange={(d: Date | null) =>
                                setF({
                                    ...f,
                                    caseDate: d ? toYMD(d) : "",
                                })
                            }
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            isClearable
                        />
                    </div>

                    <div>
                        <Label>Problem</Label>

                        <Input
                            value={f.problem}
                            onChange={(e) =>
                                setF({ ...f, problem: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <Label>Treatment</Label>

                        <Input
                            value={f.treatment}
                            onChange={(e) =>
                                setF({ ...f, treatment: e.target.value })
                            }
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <Label>Details</Label>

                        <Textarea
                            value={f.details}
                            onChange={(e) =>
                                setF({ ...f, details: e.target.value })
                            }
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
                            Save Case History
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
