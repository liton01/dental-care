import { db } from "@/lib/prisma";
import { bad, ok, requireSession } from "@/lib/api";

// Trial balance: debit/credit totals per ledger head within a date range.
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const sp = new URL(req.url).searchParams;
  const dateFrom = sp.get("dateFrom")?.trim() || "";
  const dateTo = sp.get("dateTo")?.trim() || "";
  const postedOnly = sp.get("postedOnly") === "1";

  const where: any = {};
  if (postedOnly || dateFrom || dateTo) where.voucher = { is: {} };
  if (postedOnly) where.voucher.is.isPosted = "Y";
  if (dateFrom || dateTo) {
    where.voucher.is.voucherDate = {};
    if (dateFrom) where.voucher.is.voucherDate.gte = new Date(dateFrom);
    if (dateTo) where.voucher.is.voucherDate.lte = new Date(dateTo + "T23:59:59.999");
  }

  const rows = await db.accVoucherDetail.findMany({
    where,
    include: { accMainClass: { include: { acClass: { include: { parentClass: true } } } } },
  });

  const byAccount: Record<number, any> = {};
  for (const d of rows as any[]) {
    const a = byAccount[d.accMainClassId] ||= {
      accountId: d.accMainClassId,
      code: d.accMainClass.mainCode,
      name: d.accMainClass.mainName,
      group: d.accMainClass.acClass?.parentClass?.name || "",
      debit: 0,
      credit: 0,
    };
    a.debit += Number(d.debit);
    a.credit += Number(d.credit);
  }

  const accounts = Object.values(byAccount)
    .map((a: any) => {
      const net = a.debit - a.credit;
      return { ...a, balDebit: net > 0 ? net : 0, balCredit: net < 0 ? -net : 0 };
    })
    .sort((x: any, y: any) => String(x.code).localeCompare(String(y.code)));

  return ok({ accounts });
}
