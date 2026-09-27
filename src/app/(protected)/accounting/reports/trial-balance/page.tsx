"use client";
import { useState } from "react";
import { Card, Label, Button } from "@/components/ui";
import { Search, RotateCw, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const toYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const money = (n: number) => n.toFixed(2);

export default function TrialBalance() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [postedOnly, setPostedOnly] = useState(false);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (postedOnly) params.set("postedOnly", "1");
        const r = await fetch("/api/reports/trial-balance?" + params);
        setData(r.ok ? await r.json() : null);
        setLoading(false);
    };

    const accounts = data?.accounts || [];
    const tot = accounts.reduce(
        (s: any, a: any) => ({
            debit: s.debit + a.debit,
            credit: s.credit + a.credit,
            balDebit: s.balDebit + a.balDebit,
            balCredit: s.balCredit + a.balCredit,
        }),
        { debit: 0, credit: 0, balDebit: 0, balCredit: 0 }
    );

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Trial Balance</h1>

                <p className="text-sm text-slate-500">
                    Debit and credit totals per ledger head.
                </p>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
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

                    <Button onClick={run} disabled={loading}>
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Code</th>
                                <th className="p-3">Ledger Head</th>
                                <th className="p-3">Group</th>
                                <th className="p-3 text-right">Debit</th>
                                <th className="p-3 text-right">Credit</th>
                                <th className="p-3 text-right">Balance Dr</th>
                                <th className="p-3 text-right">Balance Cr</th>
                            </tr>
                        </thead>

                        <tbody>
                            {accounts.map((a: any) => (
                                <tr key={a.accountId} className="border-b">
                                    <td className="p-3 font-mono text-xs">{a.code}</td>
                                    <td className="p-3 font-medium">{a.name}</td>
                                    <td className="p-3">{a.group}</td>
                                    <td className="p-3 text-right">{money(a.debit)}</td>
                                    <td className="p-3 text-right">{money(a.credit)}</td>
                                    <td className="p-3 text-right">{a.balDebit ? money(a.balDebit) : ""}</td>
                                    <td className="p-3 text-right">{a.balCredit ? money(a.balCredit) : ""}</td>
                                </tr>
                            ))}

                            {accounts.length > 0 && (
                                <tr className={`font-semibold ${Math.abs(tot.balDebit - tot.balCredit) > 0.005 ? "text-red-600" : ""}`}>
                                    <td className="p-3" colSpan={3}>Total</td>
                                    <td className="p-3 text-right">৳ {money(tot.debit)}</td>
                                    <td className="p-3 text-right">৳ {money(tot.credit)}</td>
                                    <td className="p-3 text-right">৳ {money(tot.balDebit)}</td>
                                    <td className="p-3 text-right">৳ {money(tot.balCredit)}</td>
                                </tr>
                            )}

                            {data && accounts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No voucher entries in this range
                                    </td>
                                </tr>
                            )}

                            {!data && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Press Run Report
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
