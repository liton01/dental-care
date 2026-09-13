import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const { searchParams } = new URL(req.url), patientId = Number(searchParams.get("patientId") || 0);
  return ok(await db.caseHistory.findMany({ where: patientId ? { patientId } : {}, include: { patient: true, prescriptions: { include: { medicines: true } } }, orderBy: [{ patientId: "asc" }, { caseNo: "asc" }] }));
}
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req); if (!b?.patientId || !b?.caseNo) return bad("Patient and case number are required.");
  return ok(await db.caseHistory.create({ data: { patientId: Number(b.patientId), caseNo: Number(b.caseNo), toothNumber: b.toothNumber || null, problem: b.problem || null, treatment: b.treatment || null, details: b.details || null, caseDate: b.caseDate ? new Date(b.caseDate) : new Date(), status: b.status || "OPEN" } }), 201);
}
