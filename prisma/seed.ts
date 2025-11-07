// prisma/seed.ts
import { PrismaClient, Role, FeeType, FinanceType, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Seeding demo school database...");

  // ------------------- SCHOOL -------------------
  const school = await prisma.school.upsert({
    where: { domain: "fordschool.com" },
    update: {},
    create: { name: "Demo School", domain: "fordschool.com" },
  });

  // ------------------- USERS & STAFF -------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@fordschool.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@fordschool.com",
      password: await hashPassword("admin123"),
      role: Role.ADMIN,
      schoolId: school.id,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@fordschool.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "teacher@fordschool.com",
      password: await hashPassword("teacher123"),
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  const teacherStaff = await prisma.staff.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      position: "Teacher",
      schoolId: school.id,
    },
  });

  // ------------------- DEPARTMENTS -------------------
  const dept = await prisma.department.upsert({
    where: { name_schoolId: { name: "Science Department", schoolId: school.id } },
    update: {},
    create: {
      name: "Science Department",
      schoolId: school.id,
    },
  });

  // ------------------- CLASSES -------------------
  const classA = await prisma.class.upsert({
    where: { name_schoolId: { name: "Class A", schoolId: school.id } },
    update: {},
    create: { name: "Class A", schoolId: school.id, createdById: teacherUser.id },
  });

  const classB = await prisma.class.upsert({
    where: { name_schoolId: { name: "Class B", schoolId: school.id } },
    update: {},
    create: { name: "Class B", schoolId: school.id, createdById: teacherUser.id },
  });

  // ------------------- SUBJECTS -------------------
  const math = await prisma.subject.upsert({
    where: { name_schoolId: { name: "Mathematics", schoolId: school.id } },
    update: {},
    create: { name: "Mathematics", schoolId: school.id, createdById: teacherUser.id },
  });

  const english = await prisma.subject.upsert({
    where: { name_schoolId: { name: "English", schoolId: school.id } },
    update: {},
    create: { name: "English", schoolId: school.id, createdById: teacherUser.id },
  });

  await prisma.staff.update({
    where: { id: teacherStaff.id },
    data: { subjects: { connect: [{ id: math.id }, { id: english.id }] } },
  });

  // ------------------- STUDENTS & PARENTS -------------------
  const studentUsers = await Promise.all(
    ["Alice Smith", "Bob Johnson"].map(async (name, idx) => {
      const email = `student${idx + 1}@fordschool.com`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, password: await hashPassword("student123"), role: Role.STUDENT, schoolId: school.id },
      });

      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          schoolId: school.id,
          classId: idx % 2 === 0 ? classA.id : classB.id,
        },
      });

      // Parent upsert with compound unique key
      await prisma.parent.upsert({
        where: { email_schoolId: { email: `${name.split(" ")[0].toLowerCase()}@parent.fordschool.com`, schoolId: school.id } },
        update: {},
        create: {
          studentId: student.id,
          name: `${name.split(" ")[0]} Parent`,
          email: `${name.split(" ")[0].toLowerCase()}@parent.fordschool.com`,
          phone: `+2335000000${idx}`,
          schoolId: school.id,
        },
      });

      return student;
    })
  );

  // ------------------- EXAMS -------------------
  for (const student of studentUsers) {
    await prisma.exam.upsert({
      where: { title_schoolId: { title: `Math Midterm - ${student.userId}`, schoolId: school.id } },
      update: {},
      create: { title: `Math Midterm - ${student.userId}`, studentId: student.id, classId: student.classId!, subjectId: math.id, schoolId: school.id, maxScore: 100, score: Math.floor(Math.random() * 101) },
    });
  }

  // ------------------- ATTENDANCE -------------------
  for (const student of studentUsers) {
    await prisma.studentAttendance.upsert({
      where: { studentId_date: { studentId: student.id, date: new Date() } },
      update: {},
      create: { studentId: student.id, status: AttendanceStatus.PRESENT, schoolId: school.id },
    });
  }

  await prisma.staffAttendance.upsert({
    where: { staffId_date: { staffId: teacherStaff.id, date: new Date() } },
    update: {},
    create: { staffId: teacherStaff.id, status: AttendanceStatus.PRESENT, schoolId: school.id },
  });

  // ------------------- FINANCES -------------------
  await prisma.transaction.createMany({
    data: studentUsers.map((s) => ({
      studentId: s.id,
      type: FinanceType.INCOME,
      feeType: FeeType.TUITION,
      amount: 500,
      schoolId: school.id,
    })),
    skipDuplicates: true,
  });

  // ------------------- LIBRARY -------------------
  const author = await prisma.author.upsert({
    where: { name_schoolId: { name: "Jane Austen", schoolId: school.id } },
    update: {},
    create: { name: "Jane Austen", schoolId: school.id },
  });

  const category = await prisma.category.upsert({
    where: { name_schoolId: { name: "Fiction", schoolId: school.id } },
    update: {},
    create: { name: "Fiction", schoolId: school.id },
  });

  const book = await prisma.book.upsert({
    where: { isbn_schoolId: { isbn: "1234567890", schoolId: school.id } },
    update: {},
    create: { title: "Pride and Prejudice", isbn: "1234567890", authorId: author.id, categoryId: category.id, totalCopies: 5, available: 5, schoolId: school.id },
  });

  const librarianUser = await prisma.user.upsert({
    where: { email: "librarian@fordschool.com" },
    update: {},
    create: { name: "Libby", email: "librarian@fordschool.com", password: await hashPassword("lib123"), role: Role.LIBRARIAN, schoolId: school.id },
  });

  await prisma.libraryStaff.upsert({
    where: { userId: librarianUser.id },
    update: {},
    create: { userId: librarianUser.id, departmentId: dept.id, schoolId: school.id, position: "Librarian" },
  });

  // ------------------- RESOURCES & PURCHASES -------------------
  const resource = await prisma.resource.upsert({
    where: { name_schoolId: { name: "Chalk", schoolId: school.id } },
    update: {},
    create: { name: "Chalk", unitPrice: 2, quantity: 100, schoolId: school.id },
  });

  await prisma.purchase.createMany({
    data: studentUsers.map((s) => ({ studentId: s.id, resourceId: resource.id, quantity: 5, totalCost: 10, schoolId: school.id })),
    skipDuplicates: true,
  });

  // ------------------- BUS -------------------
  await prisma.bus.upsert({
    where: { plateNumber_schoolId: { plateNumber: "GHA-001", schoolId: school.id } },
    update: {},
    create: { plateNumber: "GHA-001", driverName: "Mr. Driver", capacity: 20, schoolId: school.id },
  });

  console.log("✅ Demo database seeded successfully!");
}

main()
  .catch((e) => { console.error("❌ Seeding error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
