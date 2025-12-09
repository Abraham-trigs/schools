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

const AdmissionSchema = z.object({
  user: z.object({
    surname: z.string(),
    firstName: z.string(),
    otherNames: z.string().optional(),
    email: z.string().email(),
    password: z.string(),
  }),
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
  admissionPin: z.string().optional(),
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

// ------------------ GET list ------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

    const baseFilters: any = { schoolId: schoolAccount.schoolId };
    const search = searchParams.get("search");
    const where = search
      ? {
          AND: [
            baseFilters,
            {
              OR: [
                { surname: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { otherNames: { contains: search, mode: "insensitive" } },
                { wardEmail: { contains: search, mode: "insensitive" } },
              ],
            },
          ],
        }
      : baseFilters;

    const admissions = await prisma.application.findMany({
      where,
      include: { student: { include: { user: true } }, previousSchools: true, familyMembers: true },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | null = null;
    if (admissions.length > limit) {
      const nextItem = admissions.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ success: true, admissions, nextCursor });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// ------------------ POST create ------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const body = await req.json();
    const parsed = AdmissionSchema.parse(body);
    const normalized = normalizeForPrisma(parsed);

    const admission = await prisma.$transaction(async (tx) => {
      // 1) Create user
      const user = await tx.user.create({
        data: {
          surname: normalized.user.surname,
          firstName: normalized.user.firstName,
          otherNames: normalized.user.otherNames,
          email: normalized.user.email,
          password: normalized.user.password,
          role: "STUDENT",
          schoolId: schoolAccount.schoolId,
        },
      });

      // 2) Create student
      const student = await tx.student.create({
        data: { userId: user.id, schoolId: schoolAccount.schoolId, enrolledAt: new Date(), classId: normalized.classId },
      });

      // 3) Create application
      const appData = {
        studentId: student.id,
        userId: user.id,
        schoolId: schoolAccount.schoolId,
        classId: normalized.classId,
        dateOfBirth: normalized.dateOfBirth,
        nationality: normalized.nationality,
        sex: normalized.sex,
        languages: normalized.languages,
        mothersTongue: normalized.mothersTongue,
        religion: normalized.religion,
        denomination: normalized.denomination,
        hometown: normalized.hometown,
        region: normalized.region,
        profilePicture: normalized.profilePicture,
        wardLivesWith: normalized.wardLivesWith,
        numberOfSiblings: normalized.numberOfSiblings,
        siblingsOlder: normalized.siblingsOlder,
        siblingsYounger: normalized.siblingsYounger,
        postalAddress: normalized.postalAddress,
        residentialAddress: normalized.residentialAddress,
        wardMobile: normalized.wardMobile,
        wardEmail: normalized.wardEmail,
        emergencyContact: normalized.emergencyContact,
        emergencyMedicalContact: normalized.emergencyMedicalContact,
        medicalSummary: normalized.medicalSummary,
        bloodType: normalized.bloodType,
        specialDisability: normalized.specialDisability,
        feesAcknowledged: normalized.feesAcknowledged ?? false,
        declarationSigned: normalized.declarationSigned ?? false,
        signature: normalized.signature,
        classification: normalized.classification,
        submittedBy: normalized.submittedBy,
        receivedBy: normalized.receivedBy,
        receivedDate: normalized.receivedDate,
        remarks: normalized.remarks,
        status: normalized.status ?? "DRAFT",
        progress: 0,
      };

      // calculate progress
      appData.progress = calculateProgress({ ...appData, familyMembers: normalized.familyMembers, previousSchools: normalized.previousSchools });

      const app = await tx.application.create({
        data: {
          ...appData,
          previousSchools: normalized.previousSchools ? { create: normalized.previousSchools } : undefined,
          familyMembers: normalized.familyMembers ? { create: normalized.familyMembers } : undefined,
        },
      });

      return app;
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors.map((e) => ({ path: e.path, message: e.message })), status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
