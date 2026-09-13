import { db } from "@/lib/prisma";
import {
    bad,
    ok,
    parseBody,
    requireSession,
} from "@/lib/api";

export async function GET() {
    if (!(await requireSession())) {
        return bad("Unauthorized", 401);
    }

    return ok(
        await db.menu.findMany({
            include: {
                children: true,
            },
            orderBy: {
                sortOrder: "asc",
            },
        })
    );
}

export async function POST(req: Request) {
    if (!(await requireSession())) {
        return bad("Unauthorized", 401);
    }

    const b = await parseBody(req);

    return ok(
        await db.menu.create({
            data: {
                title: b.title,
                path: b.path,
                icon: b.icon || null,
                sortOrder: Number(b.sortOrder || 0),
                parentId: b.parentId
                    ? Number(b.parentId)
                    : null,
                roleId: b.roleId
                    ? Number(b.roleId)
                    : null,
            },
        }),
        201
    );
}