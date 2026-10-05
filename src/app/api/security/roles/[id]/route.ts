import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    if (!(await requireSession())) return bad("Unauthorized", 401);

    const id = Number(params.id);
    const b = await parseBody(req);
    const name = String(b?.name || "").trim();
    if (!name) return bad("Role name is required.");

    const ids: number[] = Array.isArray(b.permissionIds) ? b.permissionIds.map(Number) : [];

    try {
        const role = await db.$transaction(async (tx: any) => {
            const r = await tx.role.update({
                where: { id },
                data: { name, description: b.description || null },
            });
            await tx.rolePermission.deleteMany({ where: { roleId: id } });
            if (ids.length)
                await tx.rolePermission.createMany({
                    data: ids.map((permissionId) => ({ roleId: id, permissionId })),
                });
            return r;
        });
        return ok(role);
    } catch (e: any) {
        if (e?.code === "P2002") return bad("A role with this name already exists.");
        if (e?.code === "P2025") return bad("Role not found.", 404);
        return bad("Failed to update role.", 500);
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    if (!(await requireSession())) return bad("Unauthorized", 401);

    const id = Number(params.id);
    const users = await db.userRole.count({ where: { roleId: id } });
    if (users > 0)
        return bad(`This role is assigned to ${users} user${users > 1 ? "s" : ""}. Change their role first.`);

    try {
        await db.role.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e: any) {
        if (e?.code === "P2025") return bad("Role not found.", 404);
        return bad("Failed to delete role.", 500);
    }
}
