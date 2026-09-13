import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  return ok(await db.caseHistory.update({ where: { id: Number(params.id) }, data: { toothNumber: b.toothNumber, problem: b.problem, treatment: b.treatment, details: b.details, status: b.status, caseDate: b.caseDate ? new Date(b.caseDate) : undefined } }));
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  await db.caseHistory.delete({ where: { id: Number(params.id) } }); return ok({ success: true });
}
