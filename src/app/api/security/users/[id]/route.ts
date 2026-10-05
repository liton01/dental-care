import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
import bcrypt from "bcryptjs";

const pick = { id: true, name: true, email: true, photoUrl: true, status: true, createdAt: true, roles: { include: { role: true } } };

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) return bad("Unauthorized", 401);
  const id = Number(params.id);
  const b = await parseBody(req);
  if (!b?.name || !b?.email) return bad("Name and email are required.");

  const data: any = {
    name: b.name,
    email: b.email,
    photoUrl: b.photoUrl || null,
    status: b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
  // password is optional on edit: blank keeps the current one
  if (b.password) data.passwordHash = await bcrypt.hash(b.password, 12);

  try {
    const user = await db.$transaction(async (tx: any) => {
      const u = await tx.user.update({ where: { id }, data, select: pick });
      if (b.roleId) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({ data: { userId: id, roleId: Number(b.roleId) } });
      }
      return u;
    });
    return ok(user);
  } catch (e: any) {
    if (e?.code === "P2002") return bad("This email is already used by another user.");
    if (e?.code === "P2025") return bad("User not found.", 404);
    return bad("Failed to update user.", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session: any = await requireSession();
  if (!session) return bad("Unauthorized", 401);
  const id = Number(params.id);
  if (Number(session.user?.id) === id) return bad("You cannot delete your own account while signed in.");
  try {
    await db.user.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return bad("User not found.", 404);
    if (e?.code === "P2003") return bad("This user is linked to other records and cannot be deleted. Set it Inactive instead.");
    return bad("Failed to delete user.", 500);
  }
}
