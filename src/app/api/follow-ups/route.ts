import { db } from "@/lib/prisma";
import { bad, ok, requireSession } from "@/lib/api";

// Upcoming follow-ups: cases that have a next follow-up date set.
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const sp = new URL(req.url).searchParams;
  const patientId = Number(sp.get("patientId") || 0);
  const dateFrom = sp.get("dateFrom")?.trim() || "";
  const dateTo = sp.get("dateTo")?.trim() || "";
  const includePast = sp.get("includePast") === "1";

  const where: any = { followUpDate: { not: null } };
  if (patientId) where.patientId = patientId;
  if (dateFrom || dateTo || !includePast) {
    where.followUpDate = { not: null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateFrom) where.followUpDate.gte = new Date(dateFrom);
    else if (!includePast) where.followUpDate.gte = today;
    if (dateTo) where.followUpDate.lte = new Date(dateTo + "T23:59:59.999");
  }

  const rows = await db.caseHistory.findMany({
    where,
    include: { patient: true },
    orderBy: { followUpDate: "asc" },
  });
  return ok(rows);
}
