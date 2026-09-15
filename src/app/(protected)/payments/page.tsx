"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button, Modal, SearchSelect } from "@/components/ui";
import { Plus, X, Save, Pencil, Trash2, RotateCw } from "lucide-react";
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

const TYPES = ["ADVANCE", "PAYMENT", "REFUND"];
const METHODS = ["CASH", "CARD", "BANK", "MOBILE_BANKING", "OTHER"];

const empty = {
    patientId: "",
    caseHistoryId: "",
    description: "",
    amount: "",
    discount: "0",
    paidAmount: "",
    type: "PAYMENT",
    method: "CASH",
    paymentDate: "",
};

export default function BillCollection() {
    const [patients, setPatients] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [f, setF] = useState<any>(empty);
    const [editing, setEditing] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [patientCases, setPatientCases] = useState<any[]>([]);

    // cases of the patient chosen in the modal
    useEffect(() => {
        if (!f.patientId) {
            setPatientCases([]);
            return;
        }
        fetch(`/api/cases?patientId=${f.patientId}`)
            .then((r) => r.json())
            .then((d) => setPatientCases(Array.isArray(d) ? d : []));
    }, [f.patientId]);

    // filters
    const [fltPatient, setFltPatient] = useState("");
    const [fltType, setFltType] = useState("");
    const [fltMethod, setFltMethod] = useState("");

    const load = (
        pid = fltPatient,
        type = fltType,
        method = fltMethod
    ) => {
        const params = new URLSearchParams();
        if (pid) params.set("patientId", pid);
        if (type) params.set("type", type);
        if (method) params.set("method", method);
        fetch("/api/payments?" + params.toString())
            .then((r) => r.json())
            .then(setItems);
    };

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then(setPatients);
        load();

        // arriving from case history: ?patientId=..&caseId=..
        const sp = new URLSearchParams(window.location.search);
        const pid = sp.get("patientId");
        if (pid) {
            setEditing(null);
            setF({
                ...empty,
                patientId: pid,
                caseHistoryId: sp.get("caseId") || "",
                paymentDate: toYMD(new Date()),
            });
            setModalOpen(true);
            window.history.replaceState(null, "", "/payments");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refresh = () => {
        setFltPatient("");
        setFltType("");
        setFltMethod("");
        load("", "", "");
    };

    const openNew = () => {
        setEditing(null);
        setF({ ...empty, paymentDate: toYMD(new Date()) });
        setModalOpen(true);
    };

    const openEdit = (p: any) => {
        setEditing(p.id);
        setF({
            patientId: String(p.patientId),
            caseHistoryId: p.caseHistoryId ? String(p.caseHistoryId) : "",
            description: p.description || "",
            amount: String(p.amount),
            discount: String(p.discount ?? 0),
            paidAmount: String(p.paidAmount),
            type: p.type,
            method: p.method,
            paymentDate: p.paymentDate?.slice(0, 10) || "",
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
            editing ? `/api/payments/${editing}` : "/api/payments",
            {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...f,
                    paidAmount: f.paidAmount || f.amount,
                }),
            }
        );

        closeModal();
        load();
    };

    const remove = async (p: any) => {
        if (!confirm(`Delete transaction ${p.invoiceNo}?`)) return;
        await fetch(`/api/payments/${p.id}`, { method: "DELETE" });
        load();
    };

    const total = items.reduce((s, p) => s + Number(p.paidAmount), 0);

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Bill Collection
                    </h1>

                    <p className="text-sm text-slate-500">
                        Record and manage patient payments.
                    </p>
                </div>

                <Button onClick={openNew}>
                    <Plus size={16} className="mr-1.5" />
                    New Transaction
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
                            value={fltPatient}
                            onChange={(v) => {
                                setFltPatient(v);
                                load(v);
                            }}
                            placeholder="All Patients"
                        />
                    </div>

                    <div className="sm:w-40">
                        <Label>Type</Label>

                        <select
                            className="input"
                            value={fltType}
                            onChange={(e) => {
                                setFltType(e.target.value);
                                load(fltPatient, e.target.value);
                            }}
                        >
                            <option value="">All Types</option>
                            {TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:w-44">
                        <Label>Method</Label>

                        <select
                            className="input"
                            value={fltMethod}
                            onChange={(e) => {
                                setFltMethod(e.target.value);
                                load(fltPatient, fltType, e.target.value);
                            }}
                        >
                            <option value="">All Methods</option>
                            {METHODS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={refresh}
                        title="Reset filters and reload"
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Refresh
                    </Button>
                </div>

                <div className="mb-5 rounded-xl bg-teal-50 p-4">
                    <div className="text-sm text-teal-700">
                        Total collected in listed transactions
                    </div>

                    <div className="text-2xl font-bold text-teal-800">
                        ৳ {total.toFixed(2)}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Invoice</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Patient</th>
                                <th className="p-3">Case</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Discount</th>
                                <th className="p-3">Paid</th>
                                <th className="p-3">Due</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((p) => (
                                <tr key={p.id} className="border-b">
                                    <td className="p-3 max-w-[160px] truncate" title={p.invoiceNo}>
                                        {p.invoiceNo}
                                    </td>

                                    <td className="p-3 whitespace-nowrap">
                                        {fmtDate(p.paymentDate)}
                                    </td>

                                    <td className="p-3 font-medium">
                                        {p.patient.name}
                                    </td>

                                    <td className="p-3 whitespace-nowrap">
                                        {p.caseHistory
                                            ? `Case-${String(p.caseHistory.caseNo).padStart(2, "0")}`
                                            : "-"}
                                    </td>

                                    <td className="p-3">{p.type}</td>
                                    <td className="p-3">{p.method}</td>

                                    <td className="p-3">
                                        ৳ {Number(p.amount).toFixed(2)}
                                    </td>

                                    <td className="p-3">
                                        ৳ {Number(p.discount ?? 0).toFixed(2)}
                                    </td>

                                    <td className="p-3">
                                        ৳ {Number(p.paidAmount).toFixed(2)}
                                    </td>

                                    <td className="p-3">
                                        ৳ {(
                                            Number(p.amount) -
                                            Number(p.discount ?? 0) -
                                            Number(p.paidAmount)
                                        ).toFixed(2)}
                                    </td>

                                    <td className="p-3 whitespace-nowrap">
                                        <button
                                            className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50"
                                            onClick={() => openEdit(p)}
                                            title="Edit transaction"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                            onClick={() => remove(p)}
                                            title="Delete transaction"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={11}
                                        className="p-8 text-center text-slate-500"
                                    >
                                        No transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                open={modalOpen}
                title={editing ? "Update Transaction" : "New Transaction"}
                onClose={closeModal}
            >
                <form
                    onSubmit={save}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    <div className="sm:col-span-2">
                        <Label>Patient</Label>

                        <SearchSelect
                            options={patients.map((p) => ({
                                value: String(p.id),
                                label: `${p.name} — ${p.phone}`,
                            }))}
                            value={f.patientId}
                            onChange={(v) =>
                                setF({ ...f, patientId: v, caseHistoryId: "" })
                            }
                            placeholder="Search patient by name or phone..."
                            required
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <Label>Case History</Label>

                        <select
                            className="input"
                            value={f.caseHistoryId}
                            onChange={(e) =>
                                setF({
                                    ...f,
                                    caseHistoryId: e.target.value,
                                })
                            }
                            disabled={!f.patientId}
                        >
                            <option value="">
                                {f.patientId
                                    ? "No case (general payment)"
                                    : "Select a patient first"}
                            </option>

                            {patientCases.map((c) => (
                                <option key={c.id} value={c.id}>
                                    Case-{String(c.caseNo).padStart(2, "0")}
                                    {c.problem ? ` — ${c.problem}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <Label>Description</Label>

                        <Input
                            value={f.description}
                            onChange={(e) =>
                                setF({ ...f, description: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <Label>Amount</Label>

                        <Input
                            type="number"
                            step="0.01"
                            value={f.amount}
                            onChange={(e) =>
                                setF({ ...f, amount: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label>Discount</Label>

                        <Input
                            type="number"
                            step="0.01"
                            value={f.discount}
                            onChange={(e) =>
                                setF({ ...f, discount: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <Label>Paid Amount</Label>

                        <Input
                            type="number"
                            step="0.01"
                            value={f.paidAmount}
                            onChange={(e) =>
                                setF({ ...f, paidAmount: e.target.value })
                            }
                            placeholder="Defaults to amount"
                        />
                    </div>

                    <div>
                        <Label>Payment Date</Label>

                        <DatePicker
                            selected={
                                f.paymentDate
                                    ? new Date(f.paymentDate)
                                    : null
                            }
                            onChange={(d: Date | null) =>
                                setF({
                                    ...f,
                                    paymentDate: d ? toYMD(d) : "",
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
                        <Label>Type</Label>

                        <select
                            className="input"
                            value={f.type}
                            onChange={(e) =>
                                setF({ ...f, type: e.target.value })
                            }
                        >
                            {TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Method</Label>

                        <select
                            className="input"
                            value={f.method}
                            onChange={(e) =>
                                setF({ ...f, method: e.target.value })
                            }
                        >
                            {METHODS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
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
                            {editing ? "Update" : "Save Transaction"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
