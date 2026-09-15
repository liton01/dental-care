"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button } from "@/components/ui";
import { ChevronRight, ChevronDown, RotateCw, ListTree, FolderTree, Plus, Save, Trash2, Eraser } from "lucide-react";

type Sel =
    | { kind: "ac"; node: any; parentLabel: string }
    | { kind: "main"; node: any; parentLabel: string }
    | null;

// One expandable row of the tree
function TreeNode({
    label,
    code,
    badge,
    level,
    children,
    defaultOpen = false,
    forceOpen,
    selected,
    onSelect,
}: {
    label: string;
    code?: string;
    badge?: string;
    level: number;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    forceOpen?: boolean | null;
    selected?: boolean;
    onSelect?: () => void;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const hasChildren = !!children;
    const isOpen = forceOpen ?? open;

    return (
        <div>
            <div
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    selected
                        ? "bg-teal-600 text-white"
                        : level === 0
                          ? "font-semibold text-teal-800 hover:bg-slate-50"
                          : "hover:bg-slate-50"
                }`}
                style={{ paddingLeft: `${level * 22 + 8}px` }}
            >
                <button
                    type="button"
                    className={`w-4 shrink-0 ${selected ? "text-white" : "text-slate-400"}`}
                    onClick={() => hasChildren && setOpen(!isOpen)}
                >
                    {hasChildren ? (
                        isOpen ? (
                            <ChevronDown size={15} />
                        ) : (
                            <ChevronRight size={15} />
                        )
                    ) : null}
                </button>

                <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => {
                        if (onSelect) onSelect();
                        else if (hasChildren) setOpen(!isOpen);
                    }}
                >
                    {code && (
                        <span
                            className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-xs ${
                                selected
                                    ? "bg-teal-500 text-white"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                        >
                            {code}
                        </span>
                    )}

                    <span className="truncate">{label}</span>

                    {badge && (
                        <span
                            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs ${
                                selected
                                    ? "bg-teal-500 text-white"
                                    : "bg-teal-50 text-teal-700"
                            }`}
                        >
                            {badge}
                        </span>
                    )}
                </button>
            </div>

            {hasChildren && isOpen && <div>{children}</div>}
        </div>
    );
}

export default function ChartOfAccounts() {
    const [tree, setTree] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [forceOpen, setForceOpen] = useState<boolean | null>(null);
    const [sel, setSel] = useState<Sel>(null);
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [err, setErr] = useState("");

    const load = () =>
        fetch("/api/accounts/chart")
            .then((r) => r.json())
            .then(setTree);

    useEffect(() => {
        load();
    }, []);

    const clearEntry = () => {
        setSel(null);
        setCode("");
        setName("");
        setErr("");
    };

    const selectAc = (ac: any, pc: any) => {
        setSel({ kind: "ac", node: ac, parentLabel: `${pc.parentCode} — ${pc.name}` });
        setCode("");
        setName("");
        setErr("");
    };

    const selectMain = (mc: any, ac: any) => {
        setSel({ kind: "main", node: mc, parentLabel: `${ac.acCode} — ${ac.className}` });
        setCode(mc.mainCode || "");
        setName(mc.mainName || "");
        setErr("");
    };

    const doAdd = async () => {
        if (!sel) return setErr("Select an account class in the tree first.");
        const acClassId = sel.kind === "ac" ? sel.node.id : sel.node.acClassId;
        if (!name.trim()) return setErr("Name is required");
        if (!code.trim()) return setErr("Code is required");
        const r = await fetch("/api/accounts/main-class", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acClassId, mainCode: code, mainName: name }),
        });
        if (!r.ok) return setErr((await r.json()).error || "Add failed");
        clearEntry();
        load();
    };

    const doUpdate = async () => {
        if (sel?.kind !== "main") return setErr("Select a main class in the tree to update.");
        if (!name.trim()) return setErr("Name is required");
        if (!code.trim()) return setErr("Code is required");
        const r = await fetch(`/api/accounts/main-class/${sel.node.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mainCode: code, mainName: name }),
        });
        if (!r.ok) return setErr((await r.json()).error || "Update failed");
        clearEntry();
        load();
    };

    const doDelete = async () => {
        if (sel?.kind !== "main") return setErr("Select a main class in the tree to delete.");
        if (!confirm(`Delete "${sel.node.mainName}"?`)) return;
        const r = await fetch(`/api/accounts/main-class/${sel.node.id}`, {
            method: "DELETE",
        });
        if (!r.ok) return setErr((await r.json()).error || "Delete failed");
        clearEntry();
        load();
    };

    // filter the tree by name/code, keeping ancestors of matches
    const s = q.trim().toLowerCase();
    const match = (t?: string | null) => !!t && t.toLowerCase().includes(s);

    const filtered = !s
        ? tree
        : tree
              .map((pc) => {
                  const acClasses = pc.acClasses
                      .map((ac: any) => {
                          const mainClasses = ac.mainClasses.filter(
                              (mc: any) =>
                                  match(mc.mainName) || match(mc.mainCode)
                          );
                          if (match(ac.className) || match(ac.acCode))
                              return ac;
                          return mainClasses.length
                              ? { ...ac, mainClasses }
                              : null;
                      })
                      .filter(Boolean);
                  if (match(pc.name)) return pc;
                  return acClasses.length ? { ...pc, acClasses } : null;
              })
              .filter(Boolean);

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Chart of Accounts</h1>

                <p className="text-sm text-slate-500">
                    Account class hierarchy in tree view.
                </p>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-2">
                {/* Tree */}
                <Card className="p-5">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <Label>Search</Label>

                            <Input
                                placeholder="Account name or code..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="secondary"
                            onClick={() => setForceOpen(true)}
                            title="Expand all"
                        >
                            <FolderTree size={16} />
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => setForceOpen(false)}
                            title="Collapse all"
                        >
                            <ListTree size={16} />
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => {
                                setQ("");
                                setForceOpen(null);
                                clearEntry();
                                load();
                            }}
                            title="Refresh"
                        >
                            <RotateCw size={16} />
                        </Button>
                    </div>

                    <div className="rounded-xl border p-2">
                        {filtered.map((pc: any) => (
                            <TreeNode
                                key={pc.id}
                                label={pc.name}
                                code={pc.parentCode}
                                level={0}
                                defaultOpen
                                forceOpen={forceOpen}
                            >
                                {pc.acClasses.map((ac: any) => (
                                    <TreeNode
                                        key={ac.id}
                                        label={ac.className}
                                        code={ac.acCode}
                                        badge={
                                            ac.mainClasses.length
                                                ? `${ac.mainClasses.length}`
                                                : undefined
                                        }
                                        level={1}
                                        forceOpen={forceOpen}
                                        selected={
                                            sel?.kind === "ac" &&
                                            sel.node.id === ac.id
                                        }
                                        onSelect={() => selectAc(ac, pc)}
                                    >
                                        {ac.mainClasses.map((mc: any) => (
                                            <TreeNode
                                                key={mc.id}
                                                label={mc.mainName}
                                                code={mc.mainCode}
                                                level={2}
                                                forceOpen={forceOpen}
                                                selected={
                                                    sel?.kind === "main" &&
                                                    sel.node.id === mc.id
                                                }
                                                onSelect={() =>
                                                    selectMain(mc, ac)
                                                }
                                            />
                                        ))}
                                    </TreeNode>
                                ))}
                            </TreeNode>
                        ))}

                        {filtered.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                No accounts found
                            </div>
                        )}
                    </div>
                </Card>

                {/* Entry section */}
                <Card className="p-5">
                    <h2 className="mb-4 font-semibold">
                        Chart of Account Entry Section
                    </h2>

                    <div className="space-y-3">
                        <div>
                            <Label>Parent</Label>

                            <Input
                                value={
                                    sel
                                        ? sel.kind === "ac"
                                            ? `${sel.node.acCode} — ${sel.node.className}`
                                            : sel.parentLabel
                                        : ""
                                }
                                readOnly
                                className="bg-slate-50"
                                placeholder="Select a class in the tree"
                            />
                        </div>

                        <div>
                            <Label>Code</Label>

                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="e.g. 10211"
                            />
                        </div>

                        <div>
                            <Label>Name</Label>

                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Main class name"
                            />
                        </div>

                        {err && (
                            <p className="text-sm text-red-600">{err}</p>
                        )}

                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                            <Button
                                onClick={doAdd}
                                disabled={!sel}
                                title="Add a new main class under the selected class"
                            >
                                <Plus size={16} className="mr-1.5" />
                                Add
                            </Button>

                            <Button
                                onClick={doUpdate}
                                disabled={sel?.kind !== "main"}
                                title="Update the selected main class"
                            >
                                <Save size={16} className="mr-1.5" />
                                Update
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={clearEntry}
                            >
                                <Eraser size={16} className="mr-1.5" />
                                Clear
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={doDelete}
                                disabled={sel?.kind !== "main"}
                                className="!text-red-600"
                                title="Delete the selected main class"
                            >
                                <Trash2 size={16} className="mr-1.5" />
                                Delete
                            </Button>
                        </div>

                        <p className="pt-2 text-xs text-slate-500">
                            Select an account class in the tree, then enter a
                            code and name and press Add to create a main class
                            under it. Select a main class to update or delete
                            it.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
