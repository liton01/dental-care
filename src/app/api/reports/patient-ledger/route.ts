import { db } from "@/lib/prisma";
import { bad, ok, requireSession } from "@/lib/api";

// Patient ledger: voucher lines of the patient's transactions,
// filterable by ledger head (main class) and date range.
export async function GET(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const sp = new URL(req.url).searchParams;
  const patientId = Number(sp.get("patientId") || 0);
  if (!patientId) return bad("Patient is required.");
  const accountId = Number(sp.get("accountId") || 0);
  const dateFrom = sp.get("dateFrom")?.trim() || "";
  const dateTo = sp.get("dateTo")?.trim() || "";
  const postedOnly = sp.get("postedOnly") === "1";

  const where: any = { voucher: { is: { payment: { is: { patientId } } } } };
  if (accountId) where.accMainClassId = accountId;
  if (postedOnly) where.voucher.is.isPosted = "Y";
  if (dateFrom || dateTo) {
    where.voucher.is.voucherDate = {};
    if (dateFrom) where.voucher.is.voucherDate.gte = new Date(dateFrom);
    if (dateTo) where.voucher.is.voucherDate.lte = new Date(dateTo + "T23:59:59.999");
  }

  const rows = await db.accVoucherDetail.findMany({
    where,
    include: {
      accMainClass: true,
      voucher: { include: { payment: { include: { patient: true } } } },
    },
    orderBy: [{ voucher: { voucherDate: "asc" } }, { id: "asc" }],
  });

  const patient = await db.patient.findUnique({ where: { id: patientId } });

  return ok({
    patient: patient ? { id: patient.id, name: patient.name, patientNo: patient.patientNo, phone: patient.phone } : null,
    rows: rows.map((d: any) => ({
      date: d.voucher.voucherDate,
      voucherNo: d.voucher.voucherNo,
      isPosted: d.voucher.isPosted,
      account: `${d.accMainClass.mainCode} — ${d.accMainClass.mainName}`,
      narration: d.lineNarration || d.voucher.narration || "",
      debit: Number(d.debit),
      credit: Number(d.credit),
    })),
  });
}
