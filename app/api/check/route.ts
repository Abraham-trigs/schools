// // app/api/check/route.ts
// // Purpose: Centralized batch check endpoint with Redis caching for Upstash
// // Handles user, staff, student, parent, application, transaction, exam, and resource checks
// // Fully batch-ready and production-ready with caching, error handling, and validation

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/db.ts";
// import { SchoolAccount } from "@/lib/schoolAccount.ts";
// import bcrypt from "bcryptjs";
// import { z, ZodError } from "zod";
// import { Redis } from "@upstash/redis";
// import stableStringify from "fast-json-stable-stringify";

// // -------------------- Zod Schemas --------------------
// // Enum of all possible check types
// const CheckTypeEnum = z.enum([
//   "USER_PASSWORD",
//   "USER_EMAIL",
//   "STAFF_PASSWORD",
//   "STAFF_EMAIL",
//   "STUDENT_ENROLLMENT",
//   "PARENT_EMAIL",
//   "APPLICATION_STATUS",
//   "TRANSACTION_STATUS",
//   "EXAM_SCORES",
//   "RESOURCE_AVAILABILITY",
// ]);

// // Base check schema: type + payload
// const BaseCheckSchema = z.object({
//   type: CheckTypeEnum,
//   payload: z.any(),
// });

// // Batch check: array of checks, minimum 1
// const BatchCheckSchema = z.array(BaseCheckSchema).min(1);

// // -------------------- Redis Setup --------------------
// // Ensure environment variables exist
// if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
//   throw new Error(
//     "Missing Redis environment variables. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set."
//   );
// }

// // Redis client
// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN,
// });

// // -------------------- Helper: Cache Result --------------------
// // Cache results in Redis for TTL seconds
// async function cacheResult(key: string, value: any, ttl = 60) {
//   await redis.set(key, JSON.stringify(value), { ex: ttl });
// }

// // -------------------- Check Functions --------------------

// // USER_PASSWORD: validates user login credentials
// async function checkUserPassword(payload: any, schoolId: string) {
//   const key = `USER_PASSWORD:${schoolId}:${stableStringify(payload)}`;
//   // Return cached result if exists
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   const { email, password } = payload;
//   if (!email || !password) return { error: "Email and password required" };

//   // Query user in Prisma
//   const user = await prisma.user.findFirst({ where: { email, schoolId } });
//   if (!user) return { error: "User not found" };

//   // Compare hashed password
//   const valid = await bcrypt.compare(password, user.password);
//   const result = { valid };

//   // Cache result
//   await cacheResult(key, result);
//   return result;
// }

// // USER_EMAIL: checks if email exists
// async function checkUserEmail(payload: any, schoolId: string) {
//   const key = `USER_EMAIL:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.email) return { error: "Email required" };

//   const user = await prisma.user.findFirst({ where: { email: payload.email, schoolId } });
//   const result = { exists: !!user };

//   await cacheResult(key, result);
//   return result;
// }

// // STAFF_PASSWORD: validates staff login credentials
// async function checkStaffPassword(payload: any, schoolId: string) {
//   const key = `STAFF_PASSWORD:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   const { email, password } = payload;
//   if (!email || !password) return { error: "Email and password required" };

//   // Query staff with relation to user
//   const staff = await prisma.staff.findFirst({
//     where: { user: { email }, schoolId },
//     select: { user: { password: true } },
//   });
//   if (!staff) return { error: "Staff not found" };

//   const valid = await bcrypt.compare(password, staff.user.password);
//   const result = { valid };

//   await cacheResult(key, result);
//   return result;
// }

// // STAFF_EMAIL: checks if staff email exists
// async function checkStaffEmail(payload: any, schoolId: string) {
//   const key = `STAFF_EMAIL:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.email) return { error: "Email required" };

//   const staff = await prisma.staff.findFirst({
//     where: { user: { email: payload.email }, schoolId },
//   });
//   const result = { exists: !!staff };

//   await cacheResult(key, result);
//   return result;
// }

// // STUDENT_ENROLLMENT: fetch class and grade for a student
// async function checkStudentEnrollment(payload: any, schoolId: string) {
//   const key = `STUDENT_ENROLLMENT:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.studentId) return { error: "studentId required" };

//   const student = await prisma.student.findFirst({
//     where: { id: payload.studentId, schoolId },
//     select: { classId: true, gradeId: true },
//   });
//   if (!student) return { error: "Student not found" };

//   const result = { classId: student.classId, gradeId: student.gradeId };
//   await cacheResult(key, result);
//   return result;
// }

// // PARENT_EMAIL: checks if parent email exists
// async function checkParentEmail(payload: any, schoolId: string) {
//   const key = `PARENT_EMAIL:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.email) return { error: "Email required" };

//   const parent = await prisma.parent.findFirst({
//     where: { email: payload.email, student: { schoolId } },
//   });
//   const result = { exists: !!parent };

//   await cacheResult(key, result);
//   return result;
// }

// // APPLICATION_STATUS: get status and progress
// async function checkApplicationStatus(payload: any, schoolId: string) {
//   const key = `APPLICATION_STATUS:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.applicationId) return { error: "applicationId required" };

//   const application = await prisma.application.findFirst({
//     where: { id: payload.applicationId, schoolId },
//     select: { status: true, progress: true },
//   });
//   if (!application) return { error: "Application not found" };

//   const result = { status: application.status, progress: application.progress };
//   await cacheResult(key, result);
//   return result;
// }

// // TRANSACTION_STATUS: fetch student transactions
// async function checkTransactionStatus(payload: any, schoolId: string) {
//   const key = `TRANSACTION_STATUS:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.studentId) return { error: "studentId required" };

//   const transactions = await prisma.transaction.findMany({
//     where: { studentId: payload.studentId, student: { schoolId } },
//     select: { type: true, feeType: true, amount: true, date: true },
//   });

//   const result = { transactions };
//   await cacheResult(key, result);
//   return result;
// }

// // EXAM_SCORES: fetch exams for a student
// async function checkExamScores(payload: any, schoolId: string) {
//   const key = `EXAM_SCORES:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.studentId) return { error: "studentId required" };

//   const exams = await prisma.exam.findMany({
//     where: { studentId: payload.studentId, class: { schoolId } },
//     select: { title: true, score: true, maxScore: true, date: true },
//   });

//   const result = { exams };
//   await cacheResult(key, result);
//   return result;
// }

// // RESOURCE_AVAILABILITY: check resource quantity and availability
// async function checkResourceAvailability(payload: any, schoolId: string) {
//   const key = `RESOURCE_AVAILABILITY:${schoolId}:${stableStringify(payload)}`;
//   const cached = await redis.get(key);
//   if (cached) return JSON.parse(cached);

//   if (!payload?.resourceId) return { error: "resourceId required" };

//   const resource = await prisma.resource.findFirst({
//     where: { id: payload.resourceId, schoolId },
//     select: { name: true, quantity: true, available: true },
//   });
//   if (!resource) return { error: "Resource not found" };

//   const result = { resource };
//   await cacheResult(key, result);
//   return result;
// }

// // -------------------- Dispatcher --------------------
// const checkDispatcher: Record<
//   z.infer<typeof CheckTypeEnum>,
//   (payload: any, schoolId: string) => Promise<any>
// > = {
//   USER_PASSWORD: checkUserPassword,
//   USER_EMAIL: checkUserEmail,
//   STAFF_PASSWORD: checkStaffPassword,
//   STAFF_EMAIL: checkStaffEmail,
//   STUDENT_ENROLLMENT: checkStudentEnrollment,
//   PARENT_EMAIL: checkParentEmail,
//   APPLICATION_STATUS: checkApplicationStatus,
//   TRANSACTION_STATUS: checkTransactionStatus,
//   EXAM_SCORES: checkExamScores,
//   RESOURCE_AVAILABILITY: checkResourceAvailability,
// };

// // -------------------- Route Handler --------------------
// export async function POST(req: NextRequest) {
//   try {
//     // Authenticate school account
//     const schoolAccount = await SchoolAccount.init(req);
//     if (!schoolAccount) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Parse and validate batch checks
//     const body = await req.json();
//     const checks = BatchCheckSchema.parse(body);

//     // Execute all checks in parallel
//     const results = await Promise.all(
//       checks.map(async ({ type, payload }) => {
//         const data = await checkDispatcher[type](payload, schoolAccount.schoolId);
//         return { type, data };
//       })
//     );

//     return NextResponse.json({ results });
//   } catch (err) {
//     if (err instanceof ZodError) {
//       return NextResponse.json(
//         {
//           error: "Invalid request payload",
//           issues: err.issues,
//         },
//         { status: 400 }
//       );
//     }

//     console.error("POST /check error:", err);

//     return NextResponse.json(
//       { error: "Server error" },
//       { status: 500 }
//     );
//   }
// }

// /*
// Design reasoning:
// - Centralized batch endpoint reduces network requests.
// - Redis caching prevents repeated database queries and improves performance.
// - Each check type is isolated in its own function, ensuring maintainability.
// - Zod ensures request payloads are validated and normalized.
// - Parallel execution with Promise.all scales well for multiple checks.

// Structure:
// - Zod schemas for validation
// - Redis setup for caching
// - Individual check functions for each entity
// - Dispatcher maps check types to functions
// - POST route handler for auth, validation, batch execution, response

// Implementation guidance:
// - Ensure Prisma models exist and match queries
// - Auth via SchoolAccount.init(req)
// - Drop-in ready; requires UPSTASH_REDIS_REST_URL and TOKEN in env

// Scalability insight:
// - Add new check types by extending enum, creating function, adding to dispatcher
// - Caching and batch processing scales linearly; TTL tuning balances freshness vs performance
// */
