import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    ["DASHBOARD.V", "View Dashboard"],
    ["PATIENT.V", "View Patients"], ["PATIENT.C", "Create Patients"], ["PATIENT.E", "Edit Patients"],
    ["CASE.V", "View Case History"], ["CASE.C", "Create Case History"], ["CASE.E", "Edit Case History"],
    ["PRESCRIPTION.V", "View Prescriptions"], ["PRESCRIPTION.C", "Create Prescriptions"],
    ["PAYMENT.V", "View Payments"], ["PAYMENT.C", "Create Payments"],
    ["GREETING.V", "View Greetings"], ["GREETING.C", "Send Greetings"],
    ["SECURITY.V", "View Security"], ["SECURITY.M", "Manage Security"]
  ];
  for (const [code, name] of permissions) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code, name } });
  }

  const admin = await prisma.role.upsert({ where: { name: "Admin" }, update: {}, create: { name: "Admin", description: "Full access" } });
  const doctor = await prisma.role.upsert({ where: { name: "Doctor" }, update: {}, create: { name: "Doctor", description: "Clinical access" } });
  const receptionist = await prisma.role.upsert({ where: { name: "Receptionist" }, update: {}, create: { name: "Receptionist", description: "Front desk access" } });

  const allPermissions = await prisma.permission.findMany();
  for (const role of [admin, doctor, receptionist]) {
    for (const p of allPermissions) {
      if (role.name === "Admin" || (role.name === "Doctor" && !p.code.startsWith("SECURITY")) || (role.name === "Receptionist" && ["DASHBOARD.V","PATIENT.V","PATIENT.C","PATIENT.E","CASE.V","CASE.C","CASE.E","PRESCRIPTION.V","PAYMENT.V","PAYMENT.C","GREETING.V"].includes(p.code))) {
        await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } }, update: {}, create: { roleId: role.id, permissionId: p.id } });
      }
    }
  }

  const menus = [
    ["Dashboard","/dashboard","layout-dashboard",1],
    ["Patients","/patients","users",2],
    ["Case History","/cases","file-text",3],
    ["Prescriptions","/prescriptions","pill",4],
    ["Payments & Accounting","/payments","wallet",5],
    ["Greetings","/greetings","send",6],
    ["Security","/security","shield",7]
  ];
  for (const [title,path,icon,sortOrder] of menus) {
    await prisma.menu.upsert({ where: { id: Number(sortOrder) }, update: { title: String(title), path: String(path), icon: String(icon), sortOrder: Number(sortOrder) }, create: { id: Number(sortOrder), title: String(title), path: String(path), icon: String(icon), sortOrder: Number(sortOrder) } });
  }

  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const user = await prisma.user.upsert({ where: { email: "admin@mohonto.com" }, update: {}, create: { name: "System Administrator", email: "admin@mohonto.com", passwordHash } });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: admin.id } }, update: {}, create: { userId: user.id, roleId: admin.id } });

  const birthday = await prisma.greetingTemplate.findFirst({ where: { name: "Birthday Greeting" } });
  if (!birthday) await prisma.greetingTemplate.create({
    data: { name: "Birthday Greeting", subject: "Happy Birthday from Mohonto Dental Care", channel: "EMAIL", body: "Dear {{patientName}}, wishing you a very happy birthday from Mohonto Dental Care!" }
  });

  console.log("Seed complete. Admin: admin@mohonto.com / Admin@123");
}

main().finally(() => prisma.$disconnect());
