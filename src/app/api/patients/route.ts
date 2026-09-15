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
  const dateFrom = searchParams.get("dateFrom")?.trim() ?? "";
  const dateTo = searchParams.get("dateTo")?.trim() ?? "";
  if (dateFrom || dateTo) {
    where.admissionDate = {};
    if (dateFrom) where.admissionDate.gte = new Date(dateFrom);
    if (dateTo) where.admissionDate.lte = new Date(dateTo + "T23:59:59.999");
  }
  const pageParam = searchParams.get("page");
  if (pageParam) {
    const page = Math.max(1, Number(pageParam) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
    const [items, total] = await Promise.all([
      db.patient.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { caseHistories: true, prescriptions: true, payments: true } } }
      }),
      db.patient.count({ where }),
    ]);
    return ok({ items, total, page, pageSize });
  }
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
    gender: body.gender || null, bloodGroup: body.bloodGroup || null, dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
    admissionDate: body.admissionDate ? new Date(body.admissionDate) : undefined, notes: body.notes || null
  }});
  return ok(patient, 201);
}
