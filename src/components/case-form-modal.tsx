"use client";
import { useEffect, useState } from "react";
import { Input, Label, Button, Textarea, Modal, SearchSelect } from "@/components/ui";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
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
    status: "OPEN",
};

export default function CaseFormModal({
    open,
    onClose,
    onSaved,
    caseData,
    fixedPatientId,
}: {
    open: boolean;
    onClose: () => void;
    onSaved: (saved?: any) => void;
    caseData?: any | null;
    fixedPatientId?: string;
}) {
    const [patients, setPatients] = useState<any[]>([]);
    const [f, setF] = useState<any>(empty);

    useEffect(() => {
        if (!fixedPatientId) {
            fetch("/api/patients")
                .then((r) => r.json())
                .then(setPatients);
        }
    }, [fixedPatientId]);

    useEffect(() => {
        if (!open) return;
        if (caseData) {
            setF({
                patientId: String(caseData.patientId),
                caseNo: String(caseData.caseNo),
                toothNumber: caseData.toothNumber || "",
                problem: caseData.problem || "",
                treatment: caseData.treatment || "",
                details: caseData.details || "",
                caseDate: caseData.caseDate?.slice(0, 10) || "",
                status: caseData.status || "OPEN",
            });
        } else {
            setF({
                ...empty,
                patientId: fixedPatientId || "",
                caseDate: toYMD(new Date()),
            });
        }
    }, [open, caseData, fixedPatientId]);

    const save = async (e: any) => {
        e.preventDefault();

        const res = await fetch(
            caseData ? `/api/cases/${caseData.id}` : "/api/cases",
            {
                method: caseData ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            }
        );

        const saved = await res.json().catch(() => null);

        if (!res.ok) {
            toast.error(saved?.error || "Failed to save case.");
            return;
        }

        toast.success(caseData ? "Case updated" : "Case history saved");
        onClose();
        onSaved(saved);
    };

    return (
        <Modal
            open={open}
            title={caseData ? "Update Case History" : "New Case History"}
            onClose={onClose}
        >
            <form
                onSubmit={save}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
                {!fixedPatientId && !caseData && (
                    <div className="sm:col-span-2">
                        <Label>Patient</Label>

                        <SearchSelect
                            options={patients.map((p) => ({
                                value: String(p.id),
                                label: `${p.name} — ${p.phone}`,
                            }))}
                            value={f.patientId}
                            onChange={(v) => setF({ ...f, patientId: v })}
                            placeholder="Search patient by name or phone..."
                            required
                        />
                    </div>
                )}

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
                    <Label>Status</Label>

                    <select
                        className="input"
                        value={f.status}
                        onChange={(e) =>
                            setF({ ...f, status: e.target.value })
                        }
                    >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CLOSED">Closed</option>
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
                        selected={f.caseDate ? new Date(f.caseDate) : null}
                        onChange={(d: Date | null) =>
                            setF({ ...f, caseDate: d ? toYMD(d) : "" })
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="dd/mm/yyyy"
                        className="input"
                        wrapperClassName="w-full"
                        isClearable
                    />
                </div>

                <div className="sm:col-span-2">
                    <Label>Problem</Label>

                    <Textarea
                        value={f.problem}
                        onChange={(e) =>
                            setF({ ...f, problem: e.target.value })
                        }
                    />
                </div>

                <div className="sm:col-span-2">
                    <Label>Treatment</Label>

                    <Textarea
                        value={f.treatment}
                        onChange={(e) =>
                            setF({ ...f, treatment: e.target.value })
                        }
                    />
                </div>

                <div className="sm:col-span-2">
                    <Label>Remarks</Label>

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
                        onClick={onClose}
                    >
                        <X size={16} className="mr-1.5" />
                        Cancel
                    </Button>

                    <Button type="submit">
                        <Save size={16} className="mr-1.5" />
                        {caseData ? "Update" : "Save Case History"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
