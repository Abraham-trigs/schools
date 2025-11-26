// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Check if default school exists
  let school = await prisma.school.findUnique({
    where: { name: "Default School" },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "Default School",
        domain: "defaultschool.edu",
        email: "info@defaultschool.edu",
      },
    });
    console.log("Created default school:", school.name);
  }

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@defaultschool.edu" },
  });

  if (existingAdmin) {
    console.log("Admin already exists:", existingAdmin.email);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  // Create admin
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@defaultschool.edu",
      password: hashedPassword,
      role: Role.ADMIN,
      schoolId: school.id,
    },
  });

  console.log("Admin created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
