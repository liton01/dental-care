import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const patientId = Number(new URL(req.url).searchParams.get("patientId") || 0);
  return ok(await db.prescription.findMany({ where: patientId ? { patientId } : {}, include: { patient: true, caseHistory: true, medicines: true }, orderBy: { prescribedAt: "desc" } }));
}
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req); if (!b?.patientId || !b?.caseHistoryId || !Array.isArray(b.medicines)) return bad("Patient, case and medicines are required.");
  const p = await db.prescription.create({ data: { patientId: Number(b.patientId), caseHistoryId: Number(b.caseHistoryId), diagnosis: b.diagnosis || null, notes: b.notes || null, medicines: { create: b.medicines.map((m: any) => ({ medicineName: m.medicineName, dosage: m.dosage, duration: m.duration, instructions: m.instructions || null })) } }, include: { medicines: true, patient: true, caseHistory: true } });
  return ok(p, 201);
}
