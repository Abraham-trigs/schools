// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/db";
// import { cookieUser } from "@/lib/cookieUser";
// import { z } from "zod";
// import bcrypt from "bcryptjs";
// import { Role } from "@prisma/client";
// import { inferRoleFromPosition, roleToDepartment } from "@/lib/api/constants/roleInference";

// // Zod schema for staff creation
// const staffCreateSchema = z.object({
//   name: z.string().min(1),
//   email: z.string().email(),
//   password: z.string().min(6),
//   position: z.string().optional(),
//   department: z.string().optional(),
//   salary: z.number().optional(),
//   hireDate: z.string().optional(),
//   subject: z.string().optional(),
//   role: z.nativeEnum(Role).optional(),
//   classId: z.string().optional(),
// });

// // -------------------- GET: List users/staff --------------------
// export async function GET(req: Request) {
//   const user = await cookieUser();
//   if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

//   const { searchParams } = new URL(req.url);
//   const page = parseInt(searchParams.get("page") || "1");
//   const perPage = parseInt(searchParams.get("perPage") || "10");
//   const search = searchParams.get("search")?.trim() || "";
//   const skip = (page - 1) * perPage;

//   try {
//     const where = {
//       user: {
//         schoolId: user.schoolId,
//         ...(search
//           ? {
//               OR: [
//                 { name: { contains: search, mode: "insensitive" } },
//                 { email: { contains: search, mode: "insensitive" } },
//               ],
//             }
//           : {}),
//       },
//     };

//     const [staffList, total] = await Promise.all([
//       prisma.staff.findMany({
//         where,
//         include: { user: true, department: true, class: true },
//         skip,
//         take: perPage,
//         orderBy: { createdAt: "desc" },
//       }),
//       prisma.staff.count({ where }),
//     ]);

//     return NextResponse.json({ staffList, total, page, perPage });
//   } catch (err: any) {
//     console.error("Fetch staff failed:", err);
//     return NextResponse.json({ message: "Failed to fetch staff" }, { status: 500 });
//   }
// }

// // -------------------- POST: Create user + staff --------------------
// export async function POST(req: NextRequest) {
//   try {
//     const user = await cookieUser();
//     if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const parsed = staffCreateSchema.parse(body);

//     const roleToAssign = parsed.role || inferRoleFromPosition(parsed.position || "");
//     const hashedPassword = bcrypt.hashSync(parsed.password, 10);

//     const newStaff = await prisma.$transaction(async (prismaTx) => {
//       // 1️⃣ Create User
//       const newUser = await prismaTx.user.create({
//         data: {
//           name: parsed.name,
//           email: parsed.email,
//           password: hashedPassword,
//           role: roleToAssign,
//           schoolId: user.schoolId,
//         },
//       });

//       // 2️⃣ Ensure Department exists
//       let departmentId: string | null = null;
//       const deptName = parsed.department || roleToDepartment[roleToAssign];
//       if (deptName) {
//         const dept = await prismaTx.department.upsert({
//           where: { name: deptName },
//           update: {},
//           create: { name: deptName },
//         });
//         departmentId = dept.id;
//       }

//       // 3️⃣ Create Staff
//       return prismaTx.staff.create({
//         data: {
//           userId: newUser.id,
//           position: parsed.position || null,
//           departmentId,
//           classId: parsed.classId || null,
//           salary: parsed.salary || null,
//           subject: parsed.subject || null,
//           hireDate: parsed.hireDate ? new Date(parsed.hireDate) : null,
//         },
//         include: { user: true, department: true, class: true },
//       });
//     });

//     return NextResponse.json(newStaff, { status: 201 });
//   } catch (error: any) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ errors: error.errors.map((e) => e.message) }, { status: 400 });
//     }
//     console.error("POST /api/users error:", error);
//     return NextResponse.json({ error: "Unable to create staff" }, { status: 500 });
//   }
// }
