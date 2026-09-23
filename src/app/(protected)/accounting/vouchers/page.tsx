"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button, Modal, SearchSelect, Pagination } from "@/components/ui";
import { Search, RotateCw, Eye, Pencil, Trash2, X, Save, Plus } from "lucide-react";
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

const money = (n: any) => Number(n || 0).toFixed(2);

export default function JournalVouchers() {
    const [items, setItems] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [viewV, setViewV] = useState<any | null>(null);
    const [editV, setEditV] = useState<any | null>(null);
    const [ef, setEf] = useState<any>(null);
    const [err, setErr] = useState("");

    const load = (query = q, pg = page, ps = pageSize) => {
        const params = new URLSearchParams({
            page: String(pg),
            pageSize: String(ps),
        });
        if (query.trim()) params.set("q", query.trim());
        fetch("/api/vouchers?" + params.toString())
            .then((r) => r.json())
            .then((d) => {
                setItems(d.items || []);
                setTotal(d.total || 0);
            });
    };

    useEffect(() => {
        load();

        // flatten the chart tree into postable accounts
        fetch("/api/accounts/chart")
            .then((r) => r.json())
            .then((tree) => {
                if (!Array.isArray(tree)) return;
                const list: any[] = [];
                for (const pc of tree)
                    for (const ac of pc.acClasses)
                        for (const mc of ac.mainClasses)
                            list.push(mc);
                setAccounts(list);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const search = () => {
        setPage(1);
        load(q, 1);
    };

    const goToPage = (pg: number) => {
        setPage(pg);
        load(q, pg);
    };

    const changePageSize = (ps: number) => {
        setPageSize(ps);
        setPage(1);
        load(q, 1, ps);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const sums = (v: any) => ({
        dr: v.details.reduce((s: number, d: any) => s + Number(d.debit), 0),
        cr: v.details.reduce((s: number, d: any) => s + Number(d.credit), 0),
    });

    const openEdit = (v: any) => {
        setEditV(v);
        setErr("");
        setEf({
            voucherDate: v.voucherDate?.slice(0, 10) || "",
            narration: v.narration || "",
            details: v.details.map((d: any) => ({
                accMainClassId: String(d.accMainClassId),
                debit: Number(d.debit) ? String(d.debit) : "",
                credit: Number(d.credit) ? String(d.credit) : "",
                lineNarration: d.lineNarration || "",
            })),
        });
    };

    const setLine = (i: number, k: string, v: string) => {
        const details = [...ef.details];
        details[i] = { ...details[i], [k]: v };
        setEf({ ...ef, details });
    };

    const saveEdit = async (e: any) => {
        e.preventDefault();
        const r = await fetch(`/api/vouchers/${editV.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ef),
        });
        if (!r.ok) {
            setErr((await r.json()).error || "Save failed");
            return;
        }
        setEditV(null);
        setEf(null);
        load();
    };

    const remove = async (v: any) => {
        if (!confirm(`Delete voucher ${v.voucherNo}?`)) return;
        await fetch(`/api/vouchers/${v.id}`, { method: "DELETE" });
        load();
    };

    const efDr = ef
        ? ef.details.reduce((s: number, d: any) => s + Number(d.debit || 0), 0)
        : 0;
    const efCr = ef
        ? ef.details.reduce((s: number, d: any) => s + Number(d.credit || 0), 0)
        : 0;

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Journal Vouchers</h1>

                <p className="text-sm text-slate-500">
                    Vouchers generated from bill collection and manual
                    adjustments.
                </p>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="sm:w-80">
                        <Label>Search</Label>

                        <Input
                            placeholder="Voucher no or narration..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && search()}
                        />
                    </div>

                    <Button onClick={search}>
                        <Search size={16} className="mr-1.5" />
                        Search
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setQ("");
                            setPage(1);
                            load("", 1);
                        }}
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Refresh
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-3">Voucher No</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Narration</th>
                                <th className="p-3">Patient</th>
                                <th className="p-3 text-right">Debit</th>
                                <th className="p-3 text-right">Credit</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((v) => {
                                const t = sums(v);

                                return (
                                    <tr key={v.id} className="border-b">
                                        <td className="p-3 font-medium">
                                            {v.voucherNo}
                                        </td>

                                        <td className="p-3 whitespace-nowrap">
                                            {fmtDate(v.voucherDate)}
                                        </td>

                                        <td className="p-3">
                                            {v.voucherType}
                                        </td>

                                        <td className="p-3 max-w-[280px] truncate" title={v.narration || ""}>
                                            {v.narration || "-"}
                                        </td>

                                        <td className="p-3">
                                            {v.payment?.patient?.name || "-"}
                                        </td>

                                        <td className="p-3 text-right">
                                            ৳ {money(t.dr)}
                                        </td>

                                        <td className="p-3 text-right">
                                            ৳ {money(t.cr)}
                                        </td>

                                        <td className="p-3 whitespace-nowrap">
                                            <button
                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                                                onClick={() => setViewV(v)}
                                                title="View voucher details"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50"
                                                onClick={() => openEdit(v)}
                                                title="Edit voucher"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                                onClick={() => remove(v)}
                                                title="Delete voucher"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">
                                        No vouchers yet. They are created
                                        automatically when you save a bill
                                        collection transaction.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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

            {/* Detail view */}
            <Modal
                open={!!viewV}
                title={viewV ? `Voucher ${viewV.voucherNo}` : ""}
                onClose={() => setViewV(null)}
            >
                {viewV && (
                    <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-slate-500">Date: </span>
                                {fmtDate(viewV.voucherDate)}
                            </div>

                            <div>
                                <span className="text-slate-500">Type: </span>
                                {viewV.voucherType}
                            </div>

                            <div className="col-span-2">
                                <span className="text-slate-500">
                                    Narration:{" "}
                                </span>
                                {viewV.narration || "-"}
                            </div>

                            {viewV.payment && (
                                <div className="col-span-2">
                                    <span className="text-slate-500">
                                        Linked invoice:{" "}
                                    </span>
                                    {viewV.payment.invoiceNo} ·{" "}
                                    {viewV.payment.patient?.name}
                                </div>
                            )}
                        </div>

                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="py-2">Account</th>
                                    <th className="py-2 text-right">Debit</th>
                                    <th className="py-2 text-right">Credit</th>
                                </tr>
                            </thead>

                            <tbody>
                                {viewV.details.map((d: any) => (
                                    <tr key={d.id} className="border-b">
                                        <td className="py-2">
                                            <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                                                {d.accMainClass.mainCode}
                                            </span>
                                            {d.accMainClass.mainName}
                                            {d.lineNarration && (
                                                <div className="text-xs text-slate-500">
                                                    {d.lineNarration}
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-2 text-right">
                                            {Number(d.debit) ? `৳ ${money(d.debit)}` : ""}
                                        </td>

                                        <td className="py-2 text-right">
                                            {Number(d.credit) ? `৳ ${money(d.credit)}` : ""}
                                        </td>
                                    </tr>
                                ))}

                                <tr className="font-semibold">
                                    <td className="py-2">Total</td>
                                    <td className="py-2 text-right">
                                        ৳ {money(sums(viewV).dr)}
                                    </td>
                                    <td className="py-2 text-right">
                                        ৳ {money(sums(viewV).cr)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="text-xs text-slate-500">
                            Created {fmtDate(viewV.createdDate)}
                            {viewV.createdBy ? ` · ${viewV.createdBy}` : ""}
                            {viewV.updatedBy
                                ? ` — Updated ${fmtDate(viewV.updatedDate)} · ${viewV.updatedBy}`
                                : ""}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit */}
            <Modal
                open={!!editV}
                title={editV ? `Edit Voucher ${editV.voucherNo}` : ""}
                onClose={() => {
                    setEditV(null);
                    setEf(null);
                }}
            >
                {ef && (
                    <form onSubmit={saveEdit} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Voucher Date</Label>

                                <DatePicker
                                    selected={
                                        ef.voucherDate
                                            ? new Date(ef.voucherDate)
                                            : null
                                    }
                                    onChange={(d: Date | null) =>
                                        setEf({
                                            ...ef,
                                            voucherDate: d ? toYMD(d) : "",
                                        })
                                    }
                                    dateFormat="dd/MM/yyyy"
                                    className="input"
                                    wrapperClassName="w-full"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label>Narration</Label>

                                <Input
                                    value={ef.narration}
                                    onChange={(e) =>
                                        setEf({
                                            ...ef,
                                            narration: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {ef.details.map((d: any, i: number) => (
                            <div key={i} className="rounded-xl bg-slate-50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Line {i + 1}
                                    </span>

                                    {ef.details.length > 2 && (
                                        <button
                                            type="button"
                                            className="text-red-600"
                                            onClick={() =>
                                                setEf({
                                                    ...ef,
                                                    details: ef.details.filter(
                                                        (_: any, j: number) =>
                                                            j !== i
                                                    ),
                                                })
                                            }
                                            title="Remove line"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-2">
                                    <SearchSelect
                                        options={accounts.map((a) => ({
                                            value: String(a.id),
                                            label: `${a.mainCode} — ${a.mainName}`,
                                        }))}
                                        value={d.accMainClassId}
                                        onChange={(v) =>
                                            setLine(i, "accMainClassId", v)
                                        }
                                        placeholder="Search account..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Debit"
                                        value={d.debit}
                                        onChange={(e) =>
                                            setLine(i, "debit", e.target.value)
                                        }
                                    />

                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Credit"
                                        value={d.credit}
                                        onChange={(e) =>
                                            setLine(i, "credit", e.target.value)
                                        }
                                    />
                                </div>

                                <Input
                                    className="mt-2"
                                    placeholder="Line narration (optional)"
                                    value={d.lineNarration}
                                    onChange={(e) =>
                                        setLine(
                                            i,
                                            "lineNarration",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        ))}

                        <div className="flex items-center justify-between text-sm">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    setEf({
                                        ...ef,
                                        details: [
                                            ...ef.details,
                                            {
                                                accMainClassId: "",
                                                debit: "",
                                                credit: "",
                                                lineNarration: "",
                                            },
                                        ],
                                    })
                                }
                            >
                                <Plus size={16} className="mr-1.5" />
                                Line
                            </Button>

                            <span
                                className={
                                    Math.abs(efDr - efCr) > 0.005
                                        ? "font-semibold text-red-600"
                                        : "font-semibold text-teal-700"
                                }
                            >
                                Dr ৳ {money(efDr)} · Cr ৳ {money(efCr)}
                            </span>
                        </div>

                        {err && <p className="text-sm text-red-600">{err}</p>}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setEditV(null);
                                    setEf(null);
                                }}
                            >
                                <X size={16} className="mr-1.5" />
                                Cancel
                            </Button>

                            <Button type="submit">
                                <Save size={16} className="mr-1.5" />
                                Update Voucher
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
