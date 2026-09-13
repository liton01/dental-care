import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
export async function GET(req:Request){if(!await requireSession())return bad("Unauthorized",401);const userId=Number(new URL(req.url).searchParams.get("userId"));return ok(await db.userPermission.findMany({where:{userId},include:{permission:true}}));}
export async function POST(req:Request){if(!await requireSession())return bad("Unauthorized",401);const b=await parseBody(req);return ok(await db.userPermission.upsert({where:{userId_permissionId:{userId:Number(b.userId),permissionId:Number(b.permissionId)}},update:{},create:{userId:Number(b.userId),permissionId:Number(b.permissionId)}}),201);}
export async function DELETE(req:Request){if(!await requireSession())return bad("Unauthorized",401);const b=await parseBody(req);await db.userPermission.delete({where:{userId_permissionId:{userId:Number(b.userId),permissionId:Number(b.permissionId)}}});return ok({success:true});}
