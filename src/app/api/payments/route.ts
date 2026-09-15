import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const sp = new URL(req.url).searchParams;
  const patientId = Number(sp.get("patientId") || 0);
  const type = sp.get("type")?.trim() || "";
  const method = sp.get("method")?.trim() || "";
  const where: any = {};
  if (patientId) where.patientId = patientId;
  if (type) where.type = type;
  if (method) where.method = method;
  return ok(await db.payment.findMany({ where, include: { patient: true }, orderBy: { paymentDate: "desc" } }));
}
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req); if (!b?.patientId || b.amount === undefined) return bad("Patient and amount are required.");
  return ok(await db.payment.create({ data: { patientId: Number(b.patientId), description: b.description || null, amount: Number(b.amount), discount: Number(b.discount || 0), paidAmount: Number(b.paidAmount ?? b.amount), type: b.type || "PAYMENT", method: b.method || "CASH", paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date() }, include: { patient: true } }), 201);
}
