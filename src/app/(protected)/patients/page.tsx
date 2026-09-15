
"use client";
import { useEffect, useState } from "react";
import { Card, Input, Label, Button, Textarea, Modal } from "@/components/ui";
import { Plus, Search, X, UserPlus, Save } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// yyyy-mm-dd from a Date, using local time so the day never shifts
const toYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// dd/mm/yyyy for display
const fmtDate = (iso?: string | null) => {
    if (!iso) return "-";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};
const empty = {
    name: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
    bloodGroup: "",
    dateOfBirth: "",
    admissionDate: "",
    notes: "",
};

const fields: { key: string; label: string; type: string }[] = [
    { key: "name", label: "Full Name", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "age", label: "Age", type: "text" },
    { key: "dateOfBirth", label: "Date Of Birth", type: "date" },
    { key: "gender", label: "Gender", type: "select" },
    { key: "bloodGroup", label: "Blood Group", type: "select" },
    { key: "admissionDate", label: "Admission Date", type: "date" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "notes", label: "Remarks", type: "textarea" },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const selectOptions: Record<string, { value: string; label: string }[]> = {
    gender: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
        { value: "OTHER", label: "Other" },
    ],
    bloodGroup: bloodGroups.map((b) => ({ value: b, label: b })),
};

export default function Patients() {
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [form, setForm] = useState<any>(empty);
    const [editing, setEditing] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const load = (
        gender = genderFilter,
        from = dateFrom,
        to = dateTo
    ) => {
        const params = new URLSearchParams({ q });
        if (gender) params.set("gender", gender);
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);
        fetch("/api/patients?" + params.toString())
            .then((r) => r.json())
            .then(setItems);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm({
            ...empty,
            admissionDate: new Date().toISOString().slice(0, 10),
        });
        setModalOpen(true);
    };

    const openEdit = (p: any) => {
        setEditing(p.id);
        setForm({
            ...p,
            age: p.age || "",
            bloodGroup: p.bloodGroup || "",
            dateOfBirth: p.dateOfBirth?.slice(0, 10) || "",
            admissionDate: p.admissionDate?.slice(0, 10) || "",
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(empty);
    };

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

        closeModal();
        load();
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Patients
                    </h1>

                    <p className="text-sm text-slate-500">
                        Register new and manage existing patients.
                    </p>
                </div>

                <Button onClick={openNew}>
                    <Plus size={16} className="mr-1.5" />
                    New Patient
                </Button>
            </div>

            {/* Patient List */}
            <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="sm:w-80">
                        <Label>Search</Label>

                        <Input
                            placeholder="Search name, phone or patient no..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && load()
                            }
                        />
                    </div>

                    <div className="sm:w-44">
                        <Label>Gender</Label>

                        <select
                            className="input"
                            value={genderFilter}
                            onChange={(e) => {
                                setGenderFilter(e.target.value);
                                load(e.target.value);
                            }}
                        >
                            <option value="">All Genders</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="sm:w-40">
                        <Label>Admission From</Label>

                        <DatePicker
                            selected={dateFrom ? new Date(dateFrom) : null}
                            onChange={(d: Date | null) => {
                                const v = d ? toYMD(d) : "";
                                setDateFrom(v);
                                load(genderFilter, v, dateTo);
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            isClearable
                        />
                    </div>

                    <div className="sm:w-40">
                        <Label>Admission To</Label>

                        <DatePicker
                            selected={dateTo ? new Date(dateTo) : null}
                            onChange={(d: Date | null) => {
                                const v = d ? toYMD(d) : "";
                                setDateTo(v);
                                load(genderFilter, dateFrom, v);
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            className="input"
                            wrapperClassName="w-full"
                            minDate={dateFrom ? new Date(dateFrom) : undefined}
                            isClearable
                        />
                    </div>

                    <Button onClick={() => load()}>
                        <Search size={16} className="mr-1.5" />
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
                                    Gender
                                </th>

                                <th className="p-3">
                                    Blood Group
                                </th>

                                <th className="p-3">
                                    Age
                                </th>

                                <th className="p-3">
                                    Admission Date
                                </th>

                                <th className="p-3">
                                    Email
                                </th>

                                <th className="p-3">
                                    Address
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
                                        {p.gender
                                            ? p.gender.charAt(0) +
                                              p.gender
                                                  .slice(1)
                                                  .toLowerCase()
                                            : "-"}
                                    </td>

                                    <td className="p-3">
                                        {p.bloodGroup || "-"}
                                    </td>

                                    <td className="p-3">
                                        {p.age ?? "-"}
                                    </td>

                                    <td className="p-3 whitespace-nowrap">
                                        {fmtDate(p.admissionDate)}
                                    </td>

                                    <td className="p-3">
                                        {p.email || "-"}
                                    </td>

                                    <td className="p-3 max-w-[180px] truncate" title={p.address || ""}>
                                        {p.address || "-"}
                                    </td>

                                    <td className="p-3">
                                        {p._count.caseHistories}
                                    </td>

                                    <td className="p-3">
                                        <button
                                            className="text-teal-700"
                                            onClick={() => openEdit(p)}
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

            {/* Patient Form Modal */}
            <Modal
                open={modalOpen}
                title={editing ? "Update Patient" : "New Patient"}
                onClose={closeModal}
            >
                <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {fields.map((f) => (
                        <div
                            key={f.key}
                            className={
                                f.type === "textarea"
                                    ? "sm:col-span-2"
                                    : ""
                            }
                        >
                            <Label>{f.label}</Label>

                            {f.type === "textarea" ? (
                                <Textarea
                                    value={form[f.key]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [f.key]: e.target.value,
                                        })
                                    }
                                />
                            ) : f.type === "select" ? (
                                <select
                                    className="input"
                                    value={form[f.key]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [f.key]: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select</option>
                                    {(selectOptions[f.key] || []).map(
                                        (o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            ) : f.type === "date" ? (
                                <DatePicker
                                    selected={
                                        form[f.key]
                                            ? new Date(form[f.key])
                                            : null
                                    }
                                    onChange={(d: Date | null) =>
                                        setForm({
                                            ...form,
                                            [f.key]: d ? toYMD(d) : "",
                                        })
                                    }
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="dd/mm/yyyy"
                                    className="input"
                                    wrapperClassName="w-full"
                                    showYearDropdown
                                    showMonthDropdown
                                    dropdownMode="select"
                                    isClearable
                                />
                            ) : (
                                <Input
                                    type={f.type}
                                    value={form[f.key]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [f.key]: e.target.value,
                                        })
                                    }
                                    required={
                                        f.key === "name" ||
                                        f.key === "phone"
                                    }
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeModal}
                        >
                            <X size={16} className="mr-1.5" />
                            Cancel
                        </Button>

                        <Button type="submit">
                            {editing ? (
                                <Save size={16} className="mr-1.5" />
                            ) : (
                                <UserPlus size={16} className="mr-1.5" />
                            )}
                            {editing ? "Update" : "Register Patient"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
