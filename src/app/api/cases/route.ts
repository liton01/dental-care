import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const { searchParams } = new URL(req.url), patientId = Number(searchParams.get("patientId") || 0);
  const q = searchParams.get("q")?.trim() ?? "";
  const where: any = {};
  if (patientId) where.patientId = patientId;
  if (q) where.OR = [
    { problem: { contains: q, mode: "insensitive" } },
    { treatment: { contains: q, mode: "insensitive" } },
    { toothNumber: { contains: q, mode: "insensitive" } },
    { patient: { is: { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { patientNo: { contains: q, mode: "insensitive" } },
    ] } } },
  ];
  return ok(await db.caseHistory.findMany({ where, include: { patient: true, prescriptions: { include: { medicines: true } } }, orderBy: [{ patientId: "asc" }, { caseNo: "asc" }] }));
}
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req); if (!b?.patientId || !b?.caseNo) return bad("Patient and case number are required.");
  return ok(await db.caseHistory.create({ data: { patientId: Number(b.patientId), caseNo: Number(b.caseNo), toothNumber: b.toothNumber || null, problem: b.problem || null, treatment: b.treatment || null, details: b.details || null, caseDate: b.caseDate ? new Date(b.caseDate) : new Date(), status: b.status || "OPEN" } }), 201);
}
