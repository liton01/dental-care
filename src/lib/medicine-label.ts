// "Sefril 500 mg (Capsule)"
export function medicineLabel(m: any) {
    if (!m) return "";
    return `${m.name}${m.strength ? ` ${m.strength}` : ""}${m.dosageForm ? ` (${m.dosageForm})` : ""}`;
}

const num = (v: any) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

// fields a user can edit on the Medicines page
export function medicineData(b: any) {
  return {
    name: b.name.trim(),
    strength: b.strength?.trim() || null,
    dosageForm: b.dosageForm?.trim() || null,
    genericName: b.genericName?.trim() || null,
    company: b.company?.trim() || null,
    segment: b.segment?.trim() || null,
    priceAmount: num(b.priceAmount),
  };
}

