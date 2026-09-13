import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";

export async function GET() {
    if (!await requireSession()) {
        return bad("Unauthorized", 401);
    }

    return ok(
        await db.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        })
    );
}

export async function POST(req: Request) {
    if (!await requireSession()) {
        return bad("Unauthorized", 401);
    }

    const b = await parseBody(req);

    return ok(
        await db.role.create({
            data: {
                name: b.name,
                description: b.description || null,
            },
        }),
        201
    );
}