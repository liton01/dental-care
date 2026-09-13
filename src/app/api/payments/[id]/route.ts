import { db } from "@/lib/prisma";
import { bad, ok, requireSession } from "@/lib/api";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const p = await db.payment.findUnique({ where: { id: Number(params.id) }, include: { patient: true } });
  return p ? ok(p) : bad("Invoice not found", 404);
}
