import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z, ZodObject } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Step Schemas ------------------
const UserSchema = z.object({
  surname: z.string(),
  firstName: z.string(),
  otherNames: z.string().optional(),
  email: z.string().email(),
  password: z.string(),
});

const Step1Schema = z.object({
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
});

const Step2Schema = z.object({
  languages: z.array(z.string()).optional(),
  mothersTongue: z.string().optional(),
  religion: z.string().optional(),
  denomination: z.string().optional(),
  hometown: z.string().optional(),
  region: z.string().optional(),
});

const Step3Schema = z.object({
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().optional(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  wardMobile: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),
});

const Step4Schema = z.object({
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
});

const PreviousSchoolSchema = z.object({
  name: z.string(),
  location: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const FamilyMemberSchema = z.object({
  relation: z.string(),
  name: z.string(),
  postalAddress: z.string(),
  residentialAddress: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  religion: z.string().optional(),
  isAlive: z.boolean().optional(),
});

const Step5Schema = z.object({
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
});

const Step6Schema = z.object({
  feesAcknowledged: z.boolean().optional(),
  declarationSigned: z.boolean().optional(),
  signature: z.string().optional(),
});

const StepSchemas: ZodObject<any>[] = [
  UserSchema,
  Step1Schema,
  Step2Schema,
  Step3Schema,
  Step4Schema,
  Step5Schema,
  Step6Schema,
];

// ------------------ Helpers ------------------
async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

function calculateDynamicProgress(data: any, schemas: ZodObject<any>[]) {
  let completedSteps = 0;
  schemas.forEach((schema) => {
    const fields = Object.keys(schema.shape);
    const stepComplete = fields.every((field) => {
      const value = data[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return value !== undefined && value !== null && value !== "";
    });
    if (stepComplete) completedSteps += 1;
  });
  return Math.round((completedSteps / schemas.length) * 100);
}

async function replaceNestedArraysTx(
  tx: any,
  applicationId: string,
  payload: { previousSchools?: any[]; familyMembers?: any[] }
) {
  const promises: Promise<any>[] = [];
  if (payload.previousSchools) {
    promises.push(tx.previousSchool.deleteMany({ where: { applicationId } }));
    if (payload.previousSchools.length > 0) {
      promises.push(
        tx.previousSchool.createMany({
          data: payload.previousSchools.map((ps) => ({ ...ps, applicationId })),
        })
      );
    }
  }
  if (payload.familyMembers) {
    promises.push(tx.familyMember.deleteMany({ where: { applicationId } }));
    if (payload.familyMembers.length > 0) {
      promises.push(
        tx.familyMember.createMany({
          data: payload.familyMembers.map((fm) => ({ ...fm, applicationId })),
        })
      );
    }
  }
  await Promise.all(promises);
}

// ------------------ POST Create ------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const body = await req.json();

    const stepIndex = body.step ?? 0;
    if (stepIndex < 0 || stepIndex >= StepSchemas.length) {
      return NextResponse.json({ error: "Invalid step index" }, { status: 400 });
    }

    const validatedData = StepSchemas[stepIndex].parse(body);

    const admission = await prisma.$transaction(async (tx) => {
      let userId: string | undefined;
      let applicationId: string | undefined;

      // Step 0: Create User & Student
      if (stepIndex === 0) {
        const user = await tx.user.create({
          data: {
            surname: validatedData.surname,
            firstName: validatedData.firstName,
            otherNames: validatedData.otherNames,
            email: validatedData.email,
            password: validatedData.password,
            role: "STUDENT",
            schoolId: schoolAccount.schoolId,
          },
        });
        userId = user.id;

        const student = await tx.student.create({
          data: {
            userId: user.id,
            schoolId: schoolAccount.schoolId,
            enrolledAt: new Date(),
          },
        });

        const app = await tx.application.create({
          data: {
            userId: user.id,
            studentId: student.id,
            schoolId: schoolAccount.schoolId,
            status: "DRAFT",
            progress: 0,
          },
        });
        applicationId = app.id;
      } else {
        // For later steps, find existing application
        const app = await tx.application.findFirst({
          where: { user: { email: body.email } },
        });
        if (!app) throw new Error("Application not found for user");
        userId = app.userId!;
        applicationId = app.id;

        // Update application with step data
        await tx.application.update({
          where: { id: applicationId },
          data: validatedData,
        });

        // Handle nested arrays if step 5
        if (stepIndex === 5) {
          await replaceNestedArraysTx(tx, applicationId, {
            previousSchools: validatedData.previousSchools,
            familyMembers: validatedData.familyMembers,
          });
        }
      }

      // Recalculate progress
      const appData = await tx.application.findUnique({ where: { id: applicationId } });
      const progress = calculateDynamicProgress(appData, StepSchemas);
      await tx.application.update({
        where: { id: applicationId },
        data: { progress },
      });

      return tx.application.findUnique({ where: { id: applicationId } });
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors.map((e) => ({ path: e.path, message: e.message })) },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}


// Key points:

// Only updates fields relevant to the current step.

// Handles nested arrays (previousSchools & familyMembers) safely.

// Recalculates progress after every step.

// Requires step from frontend to know which step is being submitted.

// Uses [id] param to update an existing admission, not create a new one.
