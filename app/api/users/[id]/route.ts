// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { z } from "zod";
// import { cookieUser } from "@/lib/helpers/cookieUser";
// import { hashSync } from "bcryptjs";

// const updateSchema = z.object({
//   name: z.string().optional(),
//   email: z.string().email().optional(),
//   password: z.string().min(6).optional(),
// role: z.enum([
//   "ADMIN",
//   "MODERATOR",
//   "PRINCIPAL",
//   "VICE_PRINCIPAL",
//   "TEACHER",
//   "ASSISTANT_TEACHER",
//   "COUNSELOR",
//   "LIBRARIAN",
//   "EXAM_OFFICER",
//   "FINANCE",
//   "HR",
//   "RECEPTIONIST",
//   "IT_SUPPORT",
//   "TRANSPORT",
//   "NURSE",
//   "COOK",
//   "CLEANER",
//   "SECURITY",
//   "MAINTENANCE",
//   "STUDENT",
//   "CLASS_REP",
//   "PARENT",
//   "ALUMNI",
//   "AUDITOR",
// ])
//  .optional(),

// });

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const { user } = await cookieUser(req);
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const foundUser = await prisma.user.findFirst({
//       where: { id: params.id, schoolId: user.schoolId },
//       include: { school: true, staff: true, student: true },
//     });

//     if (!foundUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

//     return NextResponse.json(foundUser);
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
//   }
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const { user } = await cookieUser(req);
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const parsed = updateSchema.parse(body);

//     const data = parsed.password
//       ? { ...parsed, password: hashSync(parsed.password, 10) }
//       : parsed;

//     const updated = await prisma.user.updateMany({
//       where: { id: params.id, schoolId: user.schoolId }, // scoped update
//       data,
//     });

//     if (!updated.count)
//       return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });

//     return NextResponse.json({ message: "User updated" });
//   } catch (err) {
//     console.error(err);
//     if (err instanceof z.ZodError)
//       return NextResponse.json({ error: err.errors }, { status: 400 });

//     return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
//   }
// }

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const { user } = await cookieUser(req);
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const deleted = await prisma.user.deleteMany({
//       where: { id: params.id, schoolId: user.schoolId }, // scoped delete
//     });

//     if (!deleted.count)
//       return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });

//     return NextResponse.json({ message: "User deleted" });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
//   }
// }
