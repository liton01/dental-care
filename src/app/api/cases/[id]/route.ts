import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const c = await db.caseHistory.findUnique({ where: { id: Number(params.id) }, include: { patient: true, prescriptions: { include: { items: { include: { medicine: true } } }, orderBy: { id: "asc" } } } });
  return c ? ok(c) : bad("Case not found", 404);
}

async function syncPrescription(caseId: number, patientId: number, diagnosis: string | null, medicines: any[]) {
  const lines = (medicines || []).filter((m: any) => m?.medicineId);
  const existing = await db.prescription.findFirst({ where: { caseHistoryId: caseId }, orderBy: { id: "asc" } });
  const items = lines.map((m: any) => ({
    medicineId: Number(m.medicineId),
    dosage: m.dosage?.trim() || "-",
    duration: m.duration?.trim() || "-",
    instructions: m.instructions?.trim() || null,
  }));
  if (existing) {
    await db.prescriptionItem.deleteMany({ where: { prescriptionId: existing.id } });
    if (items.length) await db.prescription.update({ where: { id: existing.id }, data: { diagnosis, items: { create: items } } });
    else await db.prescription.delete({ where: { id: existing.id } });
    return;
  }
  if (items.length) await db.prescription.create({ data: { patientId, caseHistoryId: caseId, diagnosis, items: { create: items } } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  const c = await db.caseHistory.update({ where: { id: Number(params.id) }, data: { toothNumber: b.toothNumber, bp: b.bp || null, problem: b.problem, treatment: b.treatment, details: b.details, status: b.status, caseDate: b.caseDate ? new Date(b.caseDate) : undefined } });
  if (Array.isArray(b.medicines)) await syncPrescription(c.id, c.patientId, b.problem || null, b.medicines);
  return ok(c);
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  await db.caseHistory.delete({ where: { id: Number(params.id) } }); return ok({ success: true });
}
