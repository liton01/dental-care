import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  if (!b?.mainName?.trim()) return bad("Name is required.");
  if (!b?.mainCode?.trim()) return bad("Code is required.");
  const dup = await db.accMainClass.findFirst({
    where: { mainCode: b.mainCode.trim(), id: { not: Number(params.id) } },
  });
  if (dup) return bad(`Code ${b.mainCode.trim()} already exists.`);
  const mc = await db.accMainClass.update({ where: { id: Number(params.id) }, data: {
    mainCode: b.mainCode.trim(),
    mainName: b.mainName.trim(),
  }});
  return ok(mc);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const mapCount = await db.accMapClass.count({ where: { mainClassId: Number(params.id) } });
  if (mapCount > 0) return bad("Cannot delete: this main class has map classes under it.");
  await db.accMainClass.delete({ where: { id: Number(params.id) } });
  return ok({ deleted: true });
}
