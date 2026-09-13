import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(){if(!await requireSession())return bad("Unauthorized",401);return ok(await db.permission.findMany({orderBy:{code:"asc"}}));}
export async function POST(req:Request){if(!await requireSession())return bad("Unauthorized",401);const b=await parseBody(req);return ok(await db.permission.create({data:{code:b.code,name:b.name,description:b.description||null}}),201);}
