import { PrismaClient, Role, AttendanceStatus, FeeType, FinanceType } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

function randomDate(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

const hashedPassword = await bcrypt.hash("admin123", 10);

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // -------------------- SCHOOL --------------------
  const school = await prisma.school.upsert({
    where: { name: "Ford School" },
    update: {},
    create: {
      name: "Ford School",
      address: "123 Ford Street",
    },
  });

  // -------------------- ADMIN --------------------
  const adminEmail = "admin@fordschool.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      schoolId: school.id,
    },
  });
  console.log(`Admin created for ${school.name}: ${adminEmail}`);

  // -------------------- CLASSES --------------------
  const classNames = ["Grade 1", "Grade 2", "Grade 3"];
  const classes = [];
  for (const name of classNames) {
    const cls = await prisma.class.upsert({
      where: { name_schoolId: { name, schoolId: school.id } },
      update: {},
      create: { name, schoolId: school.id },
    });
    classes.push(cls);
  }

  // -------------------- STAFF --------------------
  const staffData = [
    { name: "Alice Johnson", role: Role.TEACHER, position: "Teacher" },
    { name: "Bob Smith", role: Role.PRINCIPAL, position: "Principal" },
    { name: "Carol Lee", role: Role.HR, position: "HR" },
  ];

  const staffMembers = [];
  for (const s of staffData) {
    const user = await prisma.user.upsert({
      where: { email: `${s.name.split(" ")[0].toLowerCase()}@fordschool.com` },
      update: {},
      create: {
        name: s.name,
        email: `${s.name.split(" ")[0].toLowerCase()}@fordschool.com`,
        password: "password123",
        role: s.role,
        schoolId: school.id,
      },
    });

    const staff = await prisma.staff.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        position: s.position,
        hireDate: randomDate(365),
      },
    });

    staffMembers.push({ user, staff });
  }

  // -------------------- STUDENTS & PARENTS --------------------
  const studentNames = ["John Doe", "Jane Smith", "Sam Wilson"];
  const students = [];

  for (const name of studentNames) {
    const user = await prisma.user.upsert({
      where: { email: `${name.split(" ")[0].toLowerCase()}@fordschool.com` },
      update: {},
      create: {
        name,
        email: `${name.split(" ")[0].toLowerCase()}@fordschool.com`,
        password: "password123",
        role: Role.STUDENT,
        schoolId: school.id,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        classId: randomChoice(classes).id,
        enrolledAt: randomDate(365),
      },
    });

    await prisma.parent.upsert({
      where: { email: `parent_${name.split(" ")[0].toLowerCase()}@fordschool.com` },
      update: {},
      create: {
        studentId: student.id,
        name: `Parent of ${name}`,
        email: `parent_${name.split(" ")[0].toLowerCase()}@fordschool.com`,
        phone: `0${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      },
    });

    students.push({ user, student });
  }

  // -------------------- STUDENT ATTENDANCE --------------------
  for (const { student } of students) {
    const numRecords = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < numRecords; i++) {
      await prisma.studentAttendance.create({
        data: {
          studentId: student.id,
          date: randomDate(30),
          status: randomChoice(Object.values(AttendanceStatus)),
        },
      });
    }
  }

  // -------------------- STAFF ATTENDANCE --------------------
  for (const { staff } of staffMembers) {
    const numRecords = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < numRecords; i++) {
      await prisma.staffAttendance.create({
        data: {
          staffId: staff.id,
          date: randomDate(30),
          status: randomChoice(Object.values(AttendanceStatus)),
        },
      });
    }
  }

  // -------------------- EXAMS --------------------
  const subjects = ["Math", "Science", "English", "History", "Geography"];
  for (const { student } of students) {
    const numExams = Math.floor(Math.random() * subjects.length) + 1;
    for (let i = 0; i < numExams; i++) {
      await prisma.exam.create({
        data: {
          studentId: student.id,
          subject: subjects[i],
          score: Math.floor(Math.random() * 101),
          maxScore: 100,
          date: randomDate(30),
        },
      });
    }
  }

  // -------------------- TRANSACTIONS --------------------
  for (const { student } of students) {
    const numTransactions = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numTransactions; i++) {
      const feeType = randomChoice(Object.values(FeeType));
      const amount = Math.floor(Math.random() * 500 + 50);
      const type = randomChoice(Object.values(FinanceType));
      await prisma.transaction.create({
        data: {
          studentId: student.id,
          feeType,
          amount,
          type,
          description: `${feeType} payment`,
          date: randomDate(30),
        },
      });
    }
  }

  // -------------------- RESOURCES & PURCHASES --------------------
  const resourceNames = ["Books", "Lab Kit", "Uniform"];
  const resources = [];

  for (const name of resourceNames) {
    const res = await prisma.resource.upsert({
      where: { name_schoolId: { name, schoolId: school.id } },
      update: {},
      create: { name, unitPrice: Math.floor(Math.random() * 50 + 10), quantity: 50, schoolId: school.id },
    });
    resources.push(res);
  }

  for (const { student } of students) {
    const resource = randomChoice(resources);
    const quantity = Math.floor(Math.random() * 3) + 1;
    await prisma.purchase.create({
      data: {
        studentId: student.id,
        resourceId: resource.id,
        quantity,
        totalCost: resource.unitPrice * quantity,
        date: randomDate(30),
      },
    });
  }

  console.log("Seed complete ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
