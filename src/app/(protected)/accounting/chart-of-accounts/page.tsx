"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button } from "@/components/ui";
import { ChevronRight, ChevronDown, RotateCw, ListTree, FolderTree } from "lucide-react";

// One expandable row of the tree
function TreeNode({
    label,
    code,
    badge,
    level,
    children,
    defaultOpen = false,
    forceOpen,
}: {
    label: string;
    code?: string;
    badge?: string;
    level: number;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    forceOpen?: boolean | null;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const hasChildren = !!children;
    const isOpen = forceOpen ?? open;

    return (
        <div>
            <button
                type="button"
                onClick={() => hasChildren && setOpen(!isOpen)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${
                    level === 0 ? "font-semibold text-teal-800" : ""
                }`}
                style={{ paddingLeft: `${level * 22 + 8}px` }}
            >
                <span className="w-4 shrink-0 text-slate-400">
                    {hasChildren ? (
                        isOpen ? (
                            <ChevronDown size={15} />
                        ) : (
                            <ChevronRight size={15} />
                        )
                    ) : null}
                </span>

                {code && (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                        {code}
                    </span>
                )}

                <span className="truncate">{label}</span>

                {badge && (
                    <span className="ml-auto shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                        {badge}
                    </span>
                )}
            </button>

            {hasChildren && isOpen && <div>{children}</div>}
        </div>
    );
}

export default function ChartOfAccounts() {
    const [tree, setTree] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [forceOpen, setForceOpen] = useState<boolean | null>(null);

    const load = () =>
        fetch("/api/accounts/chart")
            .then((r) => r.json())
            .then(setTree);

    useEffect(() => {
        load();
    }, []);

    // filter the tree by name/code, keeping ancestors of matches
    const s = q.trim().toLowerCase();
    const match = (t?: string | null) =>
        !!t && t.toLowerCase().includes(s);

    const filtered = !s
        ? tree
        : tree
              .map((pc) => {
                  const acClasses = pc.acClasses
                      .map((ac: any) => {
                          const mainClasses = ac.mainClasses.filter(
                              (mc: any) =>
                                  match(mc.mainName) ||
                                  match(mc.mainCode)
                          );
                          if (
                              match(ac.className) ||
                              match(ac.acCode)
                          )
                              return ac;
                          return mainClasses.length
                              ? { ...ac, mainClasses }
                              : null;
                      })
                      .filter(Boolean);
                  if (match(pc.name)) return pc;
                  return acClasses.length
                      ? { ...pc, acClasses }
                      : null;
              })
              .filter(Boolean);

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Chart of Accounts
                    </h1>

                    <p className="text-sm text-slate-500">
                        Account class hierarchy in tree view.
                    </p>
                </div>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="sm:w-72">
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
                    >
                        <FolderTree size={16} className="mr-1.5" />
                        Expand All
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => setForceOpen(false)}
                    >
                        <ListTree size={16} className="mr-1.5" />
                        Collapse All
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setQ("");
                            setForceOpen(null);
                            load();
                        }}
                    >
                        <RotateCw size={16} className="mr-1.5" />
                        Refresh
                    </Button>
                </div>

                <div className="rounded-xl border p-2">
                    {filtered.map((pc: any) => (
                        <TreeNode
                            key={pc.id}
                            label={pc.name}
                            code={pc.parentCode}
                            badge={`${pc.acClasses.length} class${pc.acClasses.length === 1 ? "" : "es"}`}
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
                                >
                                    {ac.mainClasses.map((mc: any) => (
                                        <TreeNode
                                            key={mc.id}
                                            label={mc.mainName}
                                            code={mc.mainCode}
                                            badge={
                                                mc.mapClasses.length
                                                    ? `${mc.mapClasses.length}`
                                                    : undefined
                                            }
                                            level={2}
                                            forceOpen={forceOpen}
                                        >
                                            {mc.mapClasses.length > 0 &&
                                                mc.mapClasses.map(
                                                    (mp: any) => (
                                                        <TreeNode
                                                            key={mp.id}
                                                            label={mp.mapName}
                                                            code={mp.mapCode}
                                                            level={3}
                                                            forceOpen={forceOpen}
                                                        >
                                                            {mp.subClasses.length > 0 &&
                                                                mp.subClasses.map(
                                                                    (sc: any) => (
                                                                        <TreeNode
                                                                            key={sc.id}
                                                                            label={sc.subName}
                                                                            code={sc.subCode}
                                                                            level={4}
                                                                        />
                                                                    )
                                                                )}
                                                        </TreeNode>
                                                    )
                                                )}
                                        </TreeNode>
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
        </div>
    );
}
