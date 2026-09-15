import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

export async function GET() {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const orgs = await db.organization.findMany({ orderBy: { id: "asc" } });
  return ok(orgs);
}

export async function POST(req: Request) {
  if (!await requireSession()) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  if (!body?.nameEn) return bad("Organization Name (EN) is required.");
  const org = await db.organization.create({ data: {
    nameEn: body.nameEn, nameBn: body.nameBn || null, slogan: body.slogan || null,
    code: body.code || null, email: body.email || null, phone: body.phone || null,
    website: body.website || null, addressLine1: body.addressLine1 || null,
    addressLine2: body.addressLine2 || null, city: body.city || null,
    state: body.state || null, postalCode: body.postalCode || null,
    country: body.country || null, logoUrl: body.logoUrl || null,
    isActive: body.isActive ?? true,
  }});
  return ok(org, 201);
}
