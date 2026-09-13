
"use client";

import { useEffect, useState } from "react";
import { Card, Input, Label, Button } from "@/components/ui";

export default function Prescriptions() {
    const [patients, setPatients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);

    const [f, setF] = useState<any>({
        patientId: "",
        caseHistoryId: "",
        diagnosis: "",
        notes: "",
        medicines: [
            {
                medicineName: "",
                dosage: "",
                duration: "",
                instructions: "",
            },
        ],
    });

    const load = () => {
        fetch("/api/prescriptions")
            .then((r) => r.json())
            .then(setItems);
    };

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then(setPatients);

        load();
    }, []);

    useEffect(() => {
        if (f.patientId) {
            fetch(`/api/cases?patientId=${f.patientId}`)
                .then((r) => r.json())
                .then(setCases);
        }
    }, [f.patientId]);

    const save = async (e: any) => {
        e.preventDefault();

        await fetch("/api/prescriptions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(f),
        });

        load();
    };

    const med = (
        i: number,
        k: string,
        v: string
    ) => {
        const medicines = [...f.medicines];

        medicines[i] = {
            ...medicines[i],
            [k]: v,
        };

        setF({
            ...f,
            medicines,
        });
    };

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">
                Prescriptions
            </h1>

            <div className="grid gap-6 xl:grid-cols-3">
                {/* Prescription Form */}
                <Card className="p-5">
                    <form
                        onSubmit={save}
                        className="space-y-3"
                    >
                        {/* Patient */}
                        <div>
                            <Label>Patient</Label>

                            <select
                                className="input"
                                value={f.patientId}
                                onChange={(e) =>
                                    setF({
                                        ...f,
                                        patientId:
                                            e.target.value,
                                        caseHistoryId: "",
                                    })
                                }
                                required
                            >
                                <option value="">
                                    Select patient
                                </option>

                                {patients.map((p) => (
                                    <option
                                        key={p.id}
                                        value={p.id}
                                    >
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Case */}
                        <div>
                            <Label>Case</Label>

                            <select
                                className="input"
                                value={f.caseHistoryId}
                                onChange={(e) =>
                                    setF({
                                        ...f,
                                        caseHistoryId:
                                            e.target.value,
                                    })
                                }
                                required
                            >
                                <option value="">
                                    Select case
                                </option>

                                {cases.map((c) => (
                                    <option
                                        key={c.id}
                                        value={c.id}
                                    >
                                        Case-
                                        {String(c.caseNo).padStart(
                                            2,
                                            "0"
                                        )}{" "}
                                        —{" "}
                                        {c.problem ||
                                            "No problem"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Diagnosis & Notes */}
                        {["diagnosis", "notes"].map(
                            (k) => (
                                <div key={k}>
                                    <Label>{k}</Label>

                                    <Input
                                        value={f[k]}
                                        onChange={(e) =>
                                            setF({
                                                ...f,
                                                [k]:
                                                    e.target
                                                        .value,
                                            })
                                        }
                                    />
                                </div>
                            )
                        )}

                        {/* Medicines */}
                        {f.medicines.map(
                            (
                                m: any,
                                i: number
                            ) => (
                                <div
                                    key={i}
                                    className="rounded-xl bg-slate-50 p-3"
                                >
                                    <div className="mb-2 font-medium">
                                        Medicine {i + 1}
                                    </div>

                                    {[
                                        "medicineName",
                                        "dosage",
                                        "duration",
                                        "instructions",
                                    ].map(
                                        (k) => (
                                            <Input
                                                key={k}
                                                className="mb-2"
                                                placeholder={
                                                    k
                                                }
                                                value={
                                                    m[k]
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    med(
                                                        i,
                                                        k,
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                required={
                                                    k !==
                                                    "instructions"
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            )
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    setF({
                                        ...f,
                                        medicines: [
                                            ...f.medicines,
                                            {
                                                medicineName:
                                                    "",
                                                dosage: "",
                                                duration:
                                                    "",
                                                instructions:
                                                    "",
                                            },
                                        ],
                                    })
                                }
                            >
                                + Medicine
                            </Button>

                            <Button type="submit">
                                Save Prescription
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Prescription List */}
                <Card className="p-5 xl:col-span-2">
                    <div className="space-y-3">
                        {items.map((p) => (
                            <div
                                key={p.id}
                                className="rounded-xl border p-4"
                            >
                                <div className="flex justify-between">
                                    <b>
                                        {p.patient.name}
                                    </b>

                                    <span className="text-xs text-slate-500">
                                        Case-
                                        {String(
                                            p.caseHistory
                                                .caseNo
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </span>
                                </div>

                                <div className="mt-2 text-sm">
                                    {p.medicines.map(
                                        (m: any) => (
                                            <div
                                                key={m.id}
                                                className="flex justify-between border-b py-1"
                                            >
                                                <span>
                                                    {
                                                        m.medicineName
                                                    }
                                                </span>

                                                <span>
                                                    {
                                                        m.dosage
                                                    }{" "}
                                                    ·{" "}
                                                    {
                                                        m.duration
                                                    }
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>

                                <a
                                    className="mt-3 inline-block text-sm font-medium text-teal-700"
                                    href={`/api/prescriptions/${p.id}/pdf`}
                                    target="_blank"
                                >
                                    Print / PDF
                                </a>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
