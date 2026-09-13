import { db } from "@/lib/prisma";
import { bad, ok, parseBody, requireSession } from "@/lib/api";
import bcrypt from "bcryptjs";
export async function GET() { if (!await requireSession()) return bad("Unauthorized",401); return ok(await db.user.findMany({ select: { id:true,name:true,email:true,status:true,createdAt:true,roles:{include:{role:true}} }, orderBy:{name:"asc"} })); }
export async function POST(req:Request) {
  if (!await requireSession()) return bad("Unauthorized",401);
  const b=await parseBody(req); if(!b?.name||!b?.email||!b?.password)return bad("Name, email and password are required.");
  const user=await db.user.create({data:{name:b.name,email:b.email,passwordHash:await bcrypt.hash(b.password,12),roles:b.roleId?{create:{roleId:Number(b.roleId)}}:undefined},select:{id:true,name:true,email:true,status:true}});
  return ok(user,201);
}
