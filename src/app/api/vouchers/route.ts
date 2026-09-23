import { db } from "@/lib/prisma";
import { bad, ok, requireSession } from "@/lib/api";

export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const where: any = {};
  if (q) where.OR = [
    { voucherNo: { contains: q, mode: "insensitive" } },
    { narration: { contains: q, mode: "insensitive" } },
  ];
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));
  const include = {
    details: { include: { accMainClass: true } },
    payment: { include: { patient: true } },
  };
  const [items, total] = await Promise.all([
    db.accVoucher.findMany({ where, include, orderBy: { id: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.accVoucher.count({ where }),
  ]);
  return ok({ items, total, page, pageSize });
}
