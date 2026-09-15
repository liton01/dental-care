import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

// Create a main class under an AC class
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  if (!b?.acClassId) return bad("Parent AC class is required.");
  if (!b?.mainName?.trim()) return bad("Name is required.");
  if (!b?.mainCode?.trim()) return bad("Code is required.");
  const parent = await db.accAcClass.findUnique({ where: { id: Number(b.acClassId) } });
  if (!parent) return bad("Parent AC class not found.", 404);
  const exists = await db.accMainClass.findFirst({ where: { mainCode: b.mainCode.trim() } });
  if (exists) return bad(`Code ${b.mainCode.trim()} already exists.`);
  const mc = await db.accMainClass.create({ data: {
    acCode: parent.acCode,
    mainCode: b.mainCode.trim(),
    mainName: b.mainName.trim(),
    acClassId: parent.id,
  }});
  return ok(mc, 201);
}
