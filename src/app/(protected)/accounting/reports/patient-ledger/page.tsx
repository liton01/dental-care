"use client";
import { useEffect, useState } from "react";
import { Card, Label, Button, SearchSelect } from "@/components/ui";
import { Search, RotateCw, Loader2 } from "lucide-react";
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

const money = (n: number) => n.toFixed(2);

export default function PatientLedger() {
    const [patients, setPatients] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [patientId, setPatientId] = useState("");
    const [accountId, setAccountId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [postedOnly, setPostedOnly] = useState(false);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/patients")
            .then((r) => r.json())
            .then((d) => setPatients(Array.isArray(d) ? d : []));

        fetch("/api/accounts/chart")
            .then((r) => r.json())
            .then((tree) => {
                if (!Array.isArray(tree)) return;
                const list: any[] = [];
                for (const pc of tree)
                    for (const ac of pc.acClasses)
                        for (const mc of ac.mainClasses) list.push(mc);
                setAccounts(list);
            });
    }, []);

    const run = async () => {
        if (!patientId) return;
        setLoading(true);
        const params = new URLSearchParams({ patientId });
        if (accountId) params.set("accountId", accountId);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (postedOnly) params.set("postedOnly", "1");
        const r = await fetch("/api/reports/patient-ledger?" + params);
        setData(r.ok ? await r.json() : null);
        setLoading(false);
    };

    // running balance (debit - credit)
    let running = 0;
    const rows = (data?.rows || []).map((r: any) => {
        running += r.debit - r.credit;
        return { ...r, balance: running };
    });

    const totDr = (data?.rows || []).reduce((s: number, r: any) => s + r.debit, 0);
    const totCr = (data?.rows || []).reduce((s: number, r: any) => s + r.credit, 0);

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Patient Ledger</h1>

                <p className="text-sm text-slate-500">
                    Voucher lines of a patient with running balance.
                </p>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="sm:w-64">
                        <Label required>Patient</Label>

                        <SearchSelect
                            options={patients.map((p) => ({
                                value: String(p.id),
                                label: `${p.name} — ${p.phone}`,
                            }))}
                            value={patientId}
                            onChange={setPatientId}
                            placeholder="Search patient..."
                        />
                    </div>

                    <div className="sm:w-64">
                        <Label>Ledger Head</Label>

                        <SearchSelect
                            options={[
                                { value: "", label: "All Heads" },
                                ...accounts.map((a) => ({
                                    value: String(a.id),
                                    label: `${a.mainCode} — ${a.mainName}`,
                                })),
                            ]}
                            value={accountId}
                            onChange={setAccountId}
                            placeholder="All Heads"
                        />
                    </div>

                    <div className="sm:w-40">
                        <Label>From</Label>

                        <DatePicker
                            selected={dateFrom ? new Date(dateFrom) : null}
                            onChange={(d: Date | null) =>
                                setDateFrom(d ? toYMD(d) : "")
                            }
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            isClearable
                        />
                    </div>

                    <div className="sm:w-40">
                        <Label>To</Label>

                        <DatePicker
                            selected={dateTo ? new Date(dateTo) : null}
                            onChange={(d: Date | null) =>
                                setDateTo(d ? toYMD(d) : "")
                            }
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            minDate={dateFrom ? new Date(dateFrom) : undefined}
                            isClearable
                        />
                    </div>

                    <label className="flex items-center gap-1.5 pb-2 text-sm">
                        <input
                            type="checkbox"
                            checked={postedOnly}
                            onChange={(e) => setPostedOnly(e.target.checked)}
                        />
                        Posted only
                    </label>

                    <Button onClick={run} disabled={!patientId || loading}>
                        {loading ? (
                            <Loader2 size={16} className="mr-1.5 animate-spin" />
                        ) : (
                            <Search size={16} className="mr-1.5" />
                        )}
                        Run Report
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setPatientId("");
                            setAccountId("");
                            setDateFrom("");
                            setDateTo("");
                            setPostedOnly(false);
                            setData(null);
                        }}
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Reset
                    </Button>
                </div>

                {data?.patient && (
                    <div className="mb-3 rounded-xl bg-teal-50 p-3 text-sm">
                        <b>{data.patient.name}</b> · {data.patient.patientNo} ·{" "}
                        {data.patient.phone}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Date</th>
                                <th className="p-3">Voucher</th>
                                <th className="p-3">Ledger Head</th>
                                <th className="p-3">Narration</th>
                                <th className="p-3 text-right">Debit</th>
                                <th className="p-3 text-right">Credit</th>
                                <th className="p-3 text-right">Balance</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((r: any, i: number) => (
                                <tr key={i} className="border-b">
                                    <td className="p-3 whitespace-nowrap">
                                        {fmtDate(r.date)}
                                    </td>

                                    <td className="p-3 whitespace-nowrap">
                                        {r.voucherNo}
                                        {r.isPosted !== "Y" && (
                                            <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                                                draft
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-3">{r.account}</td>

                                    <td className="p-3 max-w-[240px] truncate" title={r.narration}>
                                        {r.narration}
                                    </td>

                                    <td className="p-3 text-right">
                                        {r.debit ? money(r.debit) : ""}
                                    </td>

                                    <td className="p-3 text-right">
                                        {r.credit ? money(r.credit) : ""}
                                    </td>

                                    <td className="p-3 text-right font-medium">
                                        {money(r.balance)}
                                    </td>
                                </tr>
                            ))}

                            {rows.length > 0 && (
                                <tr className="font-semibold">
                                    <td className="p-3" colSpan={4}>
                                        Total
                                    </td>
                                    <td className="p-3 text-right">৳ {money(totDr)}</td>
                                    <td className="p-3 text-right">৳ {money(totCr)}</td>
                                    <td className="p-3 text-right">৳ {money(totDr - totCr)}</td>
                                </tr>
                            )}

                            {data && rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No entries found for this filter
                                    </td>
                                </tr>
                            )}

                            {!data && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Pick a patient and press Run Report
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
