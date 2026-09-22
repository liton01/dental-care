import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const where = q ? { OR: [
    { name: { contains: q, mode: "insensitive" as const } },
    { dosageForm: { contains: q, mode: "insensitive" as const } },
    { treatmentUse: { contains: q, mode: "insensitive" as const } },
  ]} : {};
  return ok(await db.medicine.findMany({ where, orderBy: [{ name: "asc" }, { strength: "asc" }] }));
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  if (!b?.name?.trim()) return bad("Medicine Name is required.");
  return ok(await db.medicine.create({ data: {
    name: b.name.trim(),
    strength: b.strength?.trim() || null,
    unit: b.unit?.trim() || null,
    dosageForm: b.dosageForm?.trim() || null,
    manufacturerType: b.manufacturerType?.trim() || null,
    treatmentUse: b.treatmentUse?.trim() || null,
    createdBy: session.user?.email || session.user?.name || null,
  }}), 201);
}
