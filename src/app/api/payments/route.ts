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
  const pageParam = sp.get("page");
  if (pageParam) {
    const page = Math.max(1, Number(pageParam) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));
    const [items, total] = await Promise.all([
      db.payment.findMany({ where, include: { patient: true, caseHistory: true }, orderBy: { paymentDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      db.payment.count({ where }),
    ]);
    return ok({ items, total, page, pageSize });
  }
  return ok(await db.payment.findMany({ where, include: { patient: true, caseHistory: true }, orderBy: { paymentDate: "desc" } }));
}
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req); if (!b?.patientId || b.amount === undefined) return bad("Patient and amount are required.");
  return ok(await db.payment.create({ data: { patientId: Number(b.patientId), description: b.description || null, amount: Number(b.amount), discount: Number(b.discount || 0), paidAmount: Number(b.paidAmount ?? b.amount), type: b.type || "PAYMENT", method: b.method || "CASH", paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date(), caseHistoryId: b.caseHistoryId ? Number(b.caseHistoryId) : null }, include: { patient: true, caseHistory: true } }), 201);
}
