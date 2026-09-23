
"use client";

import { useEffect, useState } from "react";
import { Card, Input, Label, Button, SearchSelect, Pagination } from "@/components/ui";

export default function Prescriptions() {
    const [patients, setPatients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [medicineList, setMedicineList] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [f, setF] = useState<any>({
        patientId: "",
        caseHistoryId: "",
        diagnosis: "",
        notes: "",
        medicines: [
            {
                medicineId: "",
                dosage: "",
                duration: "",
                instructions: "",
            },
        ],
    });

    const load = (pg = page, ps = pageSize) => {
        fetch(`/api/prescriptions?page=${pg}&pageSize=${ps}`)
            .then((r) => r.json())
            .then((d) => {
                setItems(d.items || []);
                setTotal(d.total || 0);
            });
    };

    const goToPage = (pg: number) => {
        setPage(pg);
        load(pg);
    };

    const changePageSize = (ps: number) => {
        setPageSize(ps);
        setPage(1);
        load(1, ps);
    };

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then(setPatients);

        fetch("/api/medicines")
            .then((r) => r.json())
            .then((d) => setMedicineList(Array.isArray(d) ? d : []));

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

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

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

                                    <div className="mb-2">
                                        <SearchSelect
                                            options={medicineList.map(
                                                (md: any) => ({
                                                    value: String(md.id),
                                                    label: `${md.name}${md.strength ? ` ${md.strength} ${md.unit || ""}` : ""}${md.dosageForm ? ` (${md.dosageForm})` : ""}`,
                                                })
                                            )}
                                            value={m.medicineId}
                                            onChange={(v) =>
                                                med(i, "medicineId", v)
                                            }
                                            placeholder="Search medicine..."
                                            required
                                        />
                                    </div>

                                    {[
                                        "dosage",
                                        "duration",
                                        "instructions",
                                    ].map(
                                        (k) => (
                                            <Input
                                                key={k}
                                                className="mb-2"
                                                placeholder={
                                                    k.charAt(0).toUpperCase() +
                                                    k.slice(1)
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
                                                medicineId: "",
                                                dosage: "",
                                                duration: "",
                                                instructions: "",
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
                                    {(p.items || []).map(
                                        (m: any) => (
                                            <div
                                                key={m.id}
                                                className="flex justify-between border-b py-1"
                                            >
                                                <span>
                                                    {m.medicine?.name}
                                                    {m.medicine?.strength
                                                        ? ` ${m.medicine.strength} ${m.medicine.unit || ""}`
                                                        : ""}
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

                <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>
                            Showing{" "}
                            {total === 0 ? 0 : (page - 1) * pageSize + 1}
                            –{Math.min(page * pageSize, total)} of {total}
                        </span>

                        <select
                            className="input !w-auto py-1"
                            value={pageSize}
                            onChange={(e) =>
                                changePageSize(Number(e.target.value))
                            }
                        >
                            {[10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} / page
                                </option>
                            ))}
                        </select>
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPage={goToPage}
                    />
                </div>
                </Card>
            </div>
        </div>
    );
}
