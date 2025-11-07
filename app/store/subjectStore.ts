import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // --- SCHOOL SETUP ---
  const school = await prisma.school.upsert({
    where: { name: "Knocka International School" },
    update: {},
    create: {
      name: "Knocka International School",
      address: "123 Education Avenue",
      email: "info@knocka.edu",
      phone: "+23300000000",
    },
  });

  // --- USERS ---
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@knocka.edu" },
    update: {},
    create: {
      email: "admin@knocka.edu",
      name: "Admin User",
      role: "ADMIN",
      password: "securepassword", // Hash this in production!
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@knocka.edu" },
    update: {},
    create: {
      email: "teacher@knocka.edu",
      name: "Jane Doe",
      role: "TEACHER",
      password: "securepassword",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@knocka.edu" },
    update: {},
    create: {
      email: "student@knocka.edu",
      name: "John Student",
      role: "STUDENT",
      password: "securepassword",
    },
  });

  // --- CLASSES ---
  const classA = await prisma.class.upsert({
    where: { name_schoolId: { name: "Class A", schoolId: school.id } },
    update: {},
    create: {
      name: "Class A",
      level: "Primary 6",
      schoolId: school.id,
      createdById: adminUser.id,
    },
  });

  // --- SUBJECTS ---
  const math = await prisma.subject.upsert({
    where: { name_schoolId: { name: "Mathematics", schoolId: school.id } },
    update: {},
    create: {
      name: "Mathematics",
      schoolId: school.id,
      createdById: teacherUser.id,
    },
  });

  const english = await prisma.subject.upsert({
    where: { name_schoolId: { name: "English", schoolId: school.id } },
    update: {},
    create: {
      name: "English",
      schoolId: school.id,
      createdById: teacherUser.id,
    },
  });

  // --- STAFF ---
  const staffTeacher = await prisma.staff.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      schoolId: school.id,
      position: "TEACHER",
      salary: 1500,
      hireDate: new Date(),
    },
  });

  // --- DEPARTMENT ---
  const dept = await prisma.department.upsert({
    where: { name_schoolId: { name: "Mathematics Dept", schoolId: school.id } },
    update: {},
    create: {
      name: "Mathematics Dept",
      schoolId: school.id,
    },
  });

  // --- STUDENTS ---
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      classId: classA.id,
      schoolId: school.id,
    },
  });

  // --- PARENTS ---
  await prisma.parent.upsert({
    where: { email: "parent@knocka.edu" },
    update: {},
    create: {
      name: "Parent One",
      email: "parent@knocka.edu",
      phone: "+23399999999",
      studentId: student.id,
      schoolId: school.id,
    },
  });

  // --- LIBRARY ---
  const author = await prisma.author.upsert({
    where: { name: "William Wordsworth" },
    update: {},
    create: {
      name: "William Wordsworth",
      schoolId: school.id,
    },
  });

  const category = await prisma.category.upsert({
    where: { name_schoolId: { name: "Poetry", schoolId: school.id } },
    update: {},
    create: {
      name: "Poetry",
      schoolId: school.id,
    },
  });

  const book = await prisma.book.upsert({
    where: { isbn: "ISBN12345" },
    update: {},
    create: {
      title: "Collected Poems",
      isbn: "ISBN12345",
      authorId: author.id,
      categoryId: category.id,
      totalCopies: 5,
      available: 5,
      schoolId: school.id,
    },
  });

  // --- FINANCE ---
  await prisma.finance.create({
    data: {
      schoolId: school.id,
      type: "INCOME",
      amount: 5000,
      description: "Initial seed funding",
    },
  });

  // --- RESOURCES ---
  const resource = await prisma.resource.upsert({
    where: { name_schoolId: { name: "Projector", schoolId: school.id } },
    update: {},
    create: {
      name: "Projector",
      category: "Equipment",
      unitPrice: 2000,
      quantity: 5,
      schoolId: school.id,
    },
  });

  // --- TRANSACTIONS ---
  await prisma.transaction.create({
    data: {
      studentId: student.id,
      schoolId: school.id,
      amount: 1200,
      type: "INCOME",
      feeType: "TUITION",
      description: "Term 1 Tuition Fee",
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
