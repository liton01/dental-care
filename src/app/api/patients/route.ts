import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const gender = searchParams.get("gender")?.trim() ?? "";
  const where: any = {};
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { patientNo: { contains: q, mode: "insensitive" } }];
  if (gender) where.gender = gender;
  const patients = await db.patient.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { caseHistories: true, prescriptions: true, payments: true } } }
  });
  return ok(patients);
}
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  if (!body?.name || !body?.phone) return bad("Name and phone are required.");
  const patient = await db.patient.create({ data: {
    name: body.name, age: body.age ? Number(body.age) : null, phone: body.phone,
    email: body.email || null, address: body.address || null, photoUrl: body.photoUrl || null,
    gender: body.gender || null, dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null, notes: body.notes || null
  }});
  return ok(patient, 201);
}
