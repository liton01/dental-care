import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const patient = await db.patient.findUnique({ where: { id: Number(params.id) }, include: { caseHistories: { orderBy: { caseNo: "asc" } }, prescriptions: { include: { items: { include: { medicine: true } }, caseHistory: true }, orderBy: { prescribedAt: "desc" } }, payments: { orderBy: { paymentDate: "desc" } }, appointments: { orderBy: { appointmentAt: "asc" } } } });
  return patient ? ok(patient) : bad("Patient not found", 404);
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  const patient = await db.patient.update({ where: { id: Number(params.id) }, data: {
    name: body.name, age: body.age ? Number(body.age) : null, phone: body.phone, email: body.email || null,
    address: body.address || null, photoUrl: body.photoUrl || null, gender: body.gender || null, bloodGroup: body.bloodGroup || null,
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
    admissionDate: body.admissionDate ? new Date(body.admissionDate) : undefined, notes: body.notes || null
  }});
  return ok(patient);
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  await db.patient.delete({ where: { id: Number(params.id) } }); return ok({ success: true });
}
