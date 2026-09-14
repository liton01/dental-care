"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Input, Button } from "@/components/ui";
import { Plus, Search } from "lucide-react";

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

export default function CaseList() {
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");

    useEffect(() => {
        fetch("/api/cases")
            .then((r) => r.json())
            .then(setItems);
    }, []);

    const filtered = items.filter((c) => {
        const s = q.trim().toLowerCase();
        if (!s) return true;
        return (
            c.patient.name.toLowerCase().includes(s) ||
            (c.patient.patientNo || "").toLowerCase().includes(s) ||
            (c.problem || "").toLowerCase().includes(s) ||
            (c.treatment || "").toLowerCase().includes(s) ||
            (c.toothNumber || "").toLowerCase().includes(s)
        );
    });

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Case History List
                    </h1>

                    <p className="text-sm text-slate-500">
                        All recorded cases in tabular form.
                    </p>
                </div>

                <Link href="/cases" className="btn-primary">
                    <Plus size={16} className="mr-1.5" />
                    New Case
                </Link>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex gap-2">
                    <Input
                        placeholder="Search patient, problem, treatment or tooth..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
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
                                <th className="p-3">Prescriptions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map((c) => (
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

                                    <td className="p-3">
                                        {c.prescriptions?.length ?? 0}
                                    </td>
                                </tr>
                            ))}

                            {filtered.length === 0 && (
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
        </div>
    );
}
