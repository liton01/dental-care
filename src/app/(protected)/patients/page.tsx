
"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button } from "@/components/ui";
const empty = {
    name: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    notes: "",
};

export default function Patients() {
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [form, setForm] = useState<any>(empty);
    const [editing, setEditing] = useState<number | null>(null);

    const load = () => {
        fetch("/api/patients?q=" + encodeURIComponent(q))
            .then((r) => r.json())
            .then(setItems);
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (e: any) => {
        e.preventDefault();

        await fetch(
            editing
                ? `/api/patients/${editing}`
                : "/api/patients",
            {
                method: editing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            }
        );

        setForm(empty);
        setEditing(null);
        load();
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    Patients
                </h1>

                <p className="text-sm text-slate-500">
                    Register new and manage existing patients.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                {/* Patient Form */}
                <Card className="p-5 xl:col-span-1">
                    <h2 className="mb-4 font-semibold">
                        {editing ? "Update Patient" : "New Patient"}
                    </h2>

                    <form onSubmit={save} className="space-y-3">
                        {[
                            "name",
                            "phone",
                            "email",
                            "age",
                            "address",
                            "dateOfBirth",
                            "notes",
                        ].map((k) => (
                            <div key={k}>
                                <Label>
                                    {k === "name" ? "Full Name" : k}
                                </Label>

                                <Input
                                    type={
                                        k === "dateOfBirth"
                                            ? "date"
                                            : "text"
                                    }
                                    value={form[k]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [k]: e.target.value,
                                        })
                                    }
                                    required={
                                        k === "name" || k === "phone"
                                    }
                                />
                            </div>
                        ))}

                        <div>
                            <Label>Gender</Label>

                            <select
                                className="input"
                                value={form.gender}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        gender: e.target.value,
                                    })
                                }
                            >
                                <option value="">Select</option>
                                <option value="MALE">MALE</option>
                                <option value="FEMALE">FEMALE</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>

                        <Button className="w-full">
                            {editing ? "Update" : "Register Patient"}
                        </Button>
                    </form>
                </Card>

                {/* Patient List */}
                <Card className="p-5 xl:col-span-2">
                    <div className="mb-4 flex gap-2">
                        <Input
                            placeholder="Search name, phone or patient no..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && load()
                            }
                        />

                        <Button onClick={load}>
                            Search
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="p-3">
                                        Patient No
                                    </th>

                                    <th className="p-3">
                                        Name
                                    </th>

                                    <th className="p-3">
                                        Phone
                                    </th>

                                    <th className="p-3">
                                        Cases
                                    </th>

                                    <th className="p-3"></th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b"
                                    >
                                        <td className="p-3">
                                            {p.patientNo}
                                        </td>

                                        <td className="p-3 font-medium">
                                            {p.name}
                                        </td>

                                        <td className="p-3">
                                            {p.phone}
                                        </td>

                                        <td className="p-3">
                                            {p._count.caseHistories}
                                        </td>

                                        <td className="p-3">
                                            <button
                                                className="text-teal-700"
                                                onClick={() => {
                                                    setEditing(p.id);

                                                    setForm({
                                                        ...p,
                                                        age: p.age || "",
                                                        dateOfBirth:
                                                            p.dateOfBirth?.slice(
                                                                0,
                                                                10
                                                            ) || "",
                                                    });
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
