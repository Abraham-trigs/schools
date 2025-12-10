// app/api/admission/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z, ZodObject } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Step Schemas ------------------
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

const PreviousSchoolSchema = z.object({
  name: z.string(),
  location: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const StepSchemas: ZodObject<any>[] = [
  z.object({
    user: z.object({
      surname: z.string(),
      firstName: z.string(),
      otherNames: z.string().optional(),
      email: z.string().email(),
      password: z.string(),
    }),
  }),
  z.object({
    dateOfBirth: z.coerce.date().optional(),
    nationality: z.string().optional(),
    sex: z.string().optional(),
  }),
  z.object({
    languages: z.array(z.string()).optional(),
    mothersTongue: z.string().optional(),
    religion: z.string().optional(),
    denomination: z.string().optional(),
    hometown: z.string().optional(),
    region: z.string().optional(),
  }),
  z.object({
    profilePicture: z.string().optional(),
    wardLivesWith: z.string().optional(),
    numberOfSiblings: z.number().optional(),
    siblingsOlder: z.number().optional(),
    siblingsYounger: z.number().optional(),
  }),
  z.object({
    postalAddress: z.string().optional(),
    residentialAddress: z.string().optional(),
    wardMobile: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyMedicalContact: z.string().optional(),
  }),
  z.object({
    medicalSummary: z.string().optional(),
    bloodType: z.string().optional(),
    specialDisability: z.string().optional(),
  }),
  z.object({
    previousSchools: z.array(PreviousSchoolSchema).optional(),
    familyMembers: z.array(FamilyMemberSchema).optional(),
  }),
  z.object({
    feesAcknowledged: z.boolean().optional(),
    declarationSigned: z.boolean().optional(),
    signature: z.string().optional(),
  }),
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

// Nested arrays replacement
async function replaceNestedArraysTx(tx: any, applicationId: string, payload: { previousSchools?: any[]; familyMembers?: any[] }) {
  const promises: Promise<any>[] = [];
  if (payload.previousSchools) {
    promises.push(tx.previousSchool.deleteMany({ where: { applicationId } }));
    if (payload.previousSchools.length > 0) {
      promises.push(tx.previousSchool.createMany({ data: payload.previousSchools.map((ps) => ({ ...ps, applicationId })) }));
    }
  }
  if (payload.familyMembers) {
    promises.push(tx.familyMember.deleteMany({ where: { applicationId } }));
    if (payload.familyMembers.length > 0) {
      promises.push(tx.familyMember.createMany({ data: payload.familyMembers.map((fm) => ({ ...fm, applicationId })) }));
    }
  }
  await Promise.all(promises);
}

// ------------------ PATCH Update Admission ------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const applicationId = params.id;
    const body = await req.json();

    // Step index sent from frontend
    const stepIndex = body.step;
    if (stepIndex === undefined || stepIndex < 0 || stepIndex >= StepSchemas.length)
      return NextResponse.json({ error: "Invalid step index" }, { status: 400 });

    // Validate only current step
    const schema = StepSchemas[stepIndex];
    const parsed = schema.parse(body);

    const updatedApp = await prisma.$transaction(async (tx) => {
      // Update main fields
      const appData: any = { ...parsed };
      // Remove nested arrays temporarily
      delete appData.previousSchools;
      delete appData.familyMembers;

      const app = await tx.application.update({
        where: { id: applicationId },
        data: { ...appData },
      });

      // Handle nested arrays if present
      await replaceNestedArraysTx(tx, applicationId, {
        previousSchools: parsed.previousSchools,
        familyMembers: parsed.familyMembers,
      });

      // Re-fetch updated application for progress calculation
      const fullApp = await tx.application.findUnique({ where: { id: applicationId }, include: { previousSchools: true, familyMembers: true } });

      if (fullApp) {
        const progress = calculateDynamicProgress(fullApp, StepSchemas);
        await tx.application.update({ where: { id: applicationId }, data: { progress } });
      }

      return app;
    });

    return NextResponse.json({ success: true, application: updatedApp }, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors.map((e) => ({ path: e.path, message: e.message })) }, { status: 400 });
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
