import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo@12345", 12);
  const users = [
    { email: "student@demo.unicross.edu.ng", firstName: "Demo", lastName: "Student", role: UserRole.STUDENT },
    { email: "lecturer@demo.unicross.edu.ng", firstName: "Demo", lastName: "Lecturer", role: UserRole.LECTURER },
    { email: "admin@demo.unicross.edu.ng", firstName: "Demo", lastName: "Administrator", role: UserRole.UNIVERSITY_ADMIN },
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, firstName: user.firstName, lastName: user.lastName, role: user.role, isActive: true },
      create: { ...user, passwordHash },
    });
  }
  console.log("Demo users seeded.");
}

main().finally(() => prisma.$disconnect());
