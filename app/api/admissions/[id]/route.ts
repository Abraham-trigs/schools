import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Zod Schemas ------------------
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

const PartialAdmissionSchema = z.object({
  classId: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
  languages: z.array(z.string()).optional(),
  mothersTongue: z.string().optional(),
  religion: z.string().optional(),
  denomination: z.string().optional(),
  hometown: z.string().optional(),
  region: z.string().optional(),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().optional(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().email().optional(),
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  feesAcknowledged: z.boolean().optional(),
  declarationSigned: z.boolean().optional(),
  signature: z.string().optional(),
  classification: z.string().optional(),
  submittedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  receivedDate: z.coerce.date().optional(),
  remarks: z.string().optional(),
  status: z.string().optional(),
  progress: z.number().optional(),
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
});

// ------------------ Helpers ------------------
async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

function normalizeForPrisma(data: any) {
  const out = { ...data };
  if (out.previousSchools) out.previousSchools = out.previousSchools.map((ps: any) => ({ ...ps }));
  if (out.familyMembers) out.familyMembers = out.familyMembers.map((fm: any) => ({ ...fm }));
  return out;
}

function calculateProgress(application: any) {
  const steps = [
    ["surname", "firstName", "otherNames", "dateOfBirth", "nationality", "sex"],
    ["languages", "mothersTongue", "religion", "denomination", "hometown", "region"],
    ["profilePicture", "wardLivesWith", "numberOfSiblings", "siblingsOlder", "siblingsYounger"],
    ["postalAddress", "residentialAddress", "wardMobile", "wardEmail", "emergencyContact", "emergencyMedicalContact"],
    ["medicalSummary", "bloodType", "specialDisability"],
    ["familyMembers", "previousSchools"],
    ["feesAcknowledged", "declarationSigned", "signature"],
  ];

  let completedSteps = 0;
  steps.forEach((stepFields) => {
    const stepCompleted = stepFields.every((field) => {
      const value = application[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return value !== undefined && value !== null && value !== "";
    });
    if (stepCompleted) completedSteps += 1;
  });

  return Math.round((completedSteps / steps.length) * 100);
}

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

// ------------------ GET single admission ------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const admission = await prisma.application.findUnique({
      where: { id: params.id },
      include: { student: { include: { user: true } }, previousSchools: true, familyMembers: true },
    });

    if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    if (admission.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ success: true, admission });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// ------------------ PATCH update ------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const existing = await prisma.application.findUnique({ where: { id: params.id } });

    if (!existing) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    if (existing.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = PartialAdmissionSchema.parse(body);
    const normalized = normalizeForPrisma(parsed);

    const updatedAdmission = await prisma.$transaction(async (tx) => {
      // update main application
      const updatedApp = await tx.application.update({ where: { id: params.id }, data: normalized });

      // update nested arrays
      await replaceNestedArraysTx(tx, params.id, { previousSchools: normalized.previousSchools, familyMembers: normalized.familyMembers });

      // update student class if changed
      if (normalized.classId && existing.studentId) {
        await tx.student.update({ where: { id: existing.studentId }, data: { classId: normalized.classId } });
      }

      // calculate updated progress
      const progress = calculateProgress({ ...updatedApp, previousSchools: normalized.previousSchools, familyMembers: normalized.familyMembers });
      if (progress !== updatedApp.progress) {
        await tx.application.update({ where: { id: params.id }, data: { progress } });
        updatedApp.progress = progress;
      }

      return updatedApp;
    });

    return NextResponse.json({ success: true, admission: updatedAdmission });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
      return NextResponse.json({ error: errors, status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// ------------------ DELETE ------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const existing = await prisma.application.findUnique({ where: { id: params.id } });

    if (!existing) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    if (existing.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.application.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: "Admission deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
