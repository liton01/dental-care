import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

const include = {
    user: { select: { id: true, name: true, email: true, photoUrl: true, status: true } },
    role: { select: { id: true, name: true } },
};

export async function GET() {
    if (!(await requireSession())) return bad("Unauthorized", 401);
    const rows = await db.userRole.findMany({ include });
    rows.sort((a: any, b: any) => a.user.name.localeCompare(b.user.name) || a.role.name.localeCompare(b.role.name));
    return ok(rows);
}

export async function POST(req: Request) {
    if (!(await requireSession())) return bad("Unauthorized", 401);
    const b = await parseBody(req);
    const userId = Number(b?.userId), roleId = Number(b?.roleId);
    if (!userId || !roleId) return bad("User and role are required.");
    try {
        return ok(await db.userRole.create({ data: { userId, roleId }, include }), 201);
    } catch (e: any) {
        if (e?.code === "P2002") return bad("This user already has this role.");
        return bad("Failed to assign role.", 500);
    }
}

// change an existing assignment: { userId, roleId } -> { newUserId, newRoleId }
export async function PATCH(req: Request) {
    if (!(await requireSession())) return bad("Unauthorized", 401);
    const b = await parseBody(req);
    const userId = Number(b?.userId), roleId = Number(b?.roleId);
    const newUserId = Number(b?.newUserId), newRoleId = Number(b?.newRoleId);
    if (!userId || !roleId || !newUserId || !newRoleId) return bad("User and role are required.");
    if (userId === newUserId && roleId === newRoleId) return ok({ ok: true });
    try {
        const row = await db.$transaction(async (tx: any) => {
            await tx.userRole.delete({ where: { userId_roleId: { userId, roleId } } });
            return tx.userRole.create({ data: { userId: newUserId, roleId: newRoleId }, include });
        });
        return ok(row);
    } catch (e: any) {
        if (e?.code === "P2002") return bad("This user already has this role.");
        if (e?.code === "P2025") return bad("Assignment not found.", 404);
        return bad("Failed to update user role.", 500);
    }
}

export async function DELETE(req: Request) {
    const session: any = await requireSession();
    if (!session) return bad("Unauthorized", 401);
    const sp = new URL(req.url).searchParams;
    const userId = Number(sp.get("userId")), roleId = Number(sp.get("roleId"));
    if (!userId || !roleId) return bad("User and role are required.");

    // don't let the signed-in user strip their own last role
    if (Number(session.user?.id) === userId) {
        const count = await db.userRole.count({ where: { userId } });
        if (count <= 1) return bad("You cannot remove your own only role while signed in.");
    }

    try {
        await db.userRole.delete({ where: { userId_roleId: { userId, roleId } } });
        return ok({ ok: true });
    } catch (e: any) {
        if (e?.code === "P2025") return bad("Assignment not found.", 404);
        return bad("Failed to remove user role.", 500);
    }
}
