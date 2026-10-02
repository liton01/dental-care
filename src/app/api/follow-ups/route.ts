import { db } from "@/lib/prisma";
import { bad, ok, requireSession } from "@/lib/api";
import { followUpWhere } from "@/lib/follow-ups";

export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const sp = new URL(req.url).searchParams;
  const where = followUpWhere({
    patientId: sp.get("patientId"),
    dateFrom: sp.get("dateFrom")?.trim(),
    dateTo: sp.get("dateTo")?.trim(),
    includePast: sp.get("includePast") === "1",
    smsStatus: sp.get("smsStatus"),
  });
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(500, Math.max(1, Number(sp.get("pageSize")) || 200));
  const [items, total] = await Promise.all([
    db.caseHistory.findMany({
      where,
      include: { patient: true },
      orderBy: [{ followUpDate: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.caseHistory.count({ where }),
  ]);
  return ok({ items, total, page, pageSize });
}
