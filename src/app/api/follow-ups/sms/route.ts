import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
import { followUpWhere } from "@/lib/follow-ups";
import { sendSms } from "@/lib/messaging";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Send follow-up reminder SMS.
// mode "all": every case matching the same filters as the list
// mode "selected": only the given case ids
export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const b = await parseBody(req);
  const message: string = (b?.message || "").trim();
  if (!message) return bad("Message is required.");

  let where: any;
  if (b?.mode === "all") {
    where = followUpWhere(b.filters || {});
  } else {
    const ids: number[] = (b?.ids || []).map(Number).filter(Boolean);
    if (!ids.length) return bad("No patients selected.");
    where = { id: { in: ids }, followUpDate: { not: null } };
  }
  if (b?.skipSent !== false) {
    where = { AND: [where, { followUpSmsSentAt: null }] };
  }

  const cases = await db.caseHistory.findMany({ where, include: { patient: true }, take: 5000 });
  if (!cases.length) return bad("Nothing to send: all matching patients were already notified.");

  const org = await db.organization.findFirst({ where: { isActive: true }, orderBy: { id: "asc" } });
  const clinic = org?.nameEn || "Mohonto Dental Care";

  let sent = 0, failed = 0;
  const errors: string[] = [];
  for (const c of cases as any[]) {
    const phone = c.patient?.phone;
    if (!phone) { failed++; continue; }
    const body = message
      .replaceAll("{{patientName}}", c.patient.name)
      .replaceAll("{{date}}", fmt(new Date(c.followUpDate)))
      .replaceAll("{{clinic}}", clinic)
      .replaceAll("{{patientNo}}", c.patient.patientNo);
    const n = await db.notification.create({
      data: { patientId: c.patientId, channel: "SMS", recipient: phone, subject: "Follow-up reminder", body },
    });
    try {
      await sendSms(phone, body);
      await db.notification.update({ where: { id: n.id }, data: { status: "SENT", sentAt: new Date() } });
      await db.caseHistory.update({ where: { id: c.id }, data: { followUpSmsSentAt: new Date() } });
      sent++;
    } catch (e: any) {
      await db.notification.update({ where: { id: n.id }, data: { status: "FAILED", error: e?.message } });
      failed++;
      if (errors.length < 3) errors.push(`${c.patient.name}: ${e?.message}`);
    }
  }
  return ok({ sent, failed, total: cases.length, errors });
}
