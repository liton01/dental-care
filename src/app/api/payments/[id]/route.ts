import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
import { generateVoucherForPayment } from "@/lib/vouchers";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const p = await db.payment.findUnique({ where: { id: Number(params.id) }, include: { patient: true } });
  return p ? ok(p) : bad("Invoice not found", 404);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  if (!b?.patientId || b.amount === undefined) return bad("Patient and amount are required.");
  const updated = await db.payment.update({ where: { id: Number(params.id) }, data: {
    patientId: Number(b.patientId), description: b.description || null,
    amount: Number(b.amount), discount: Number(b.discount || 0),
    paidAmount: Number(b.paidAmount ?? b.amount), type: b.type || "PAYMENT",
    method: b.method || "CASH",
    paymentDate: b.paymentDate ? new Date(b.paymentDate) : undefined,
    caseHistoryId: b.caseHistoryId ? Number(b.caseHistoryId) : null,
  }, include: { patient: true, caseHistory: true } });
  await generateVoucherForPayment(updated.id, session.user?.email || session.user?.name).catch(() => {});
  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  await db.payment.delete({ where: { id: Number(params.id) } });
  return ok({ deleted: true });
}
