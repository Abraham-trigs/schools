import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

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
  startDate: z.string(),
  endDate: z.string(),
});

const AdmissionSchema = z.object({
  classId: z.string(),
  surname: z.string(),
  firstName: z.string(),
  otherNames: z.string().optional(),
  dateOfBirth: z.string(),
  nationality: z.string(),
  sex: z.string(),
  languages: z.array(z.string()),
  mothersTongue: z.string(),
  religion: z.string(),
  denomination: z.string().optional(),
  hometown: z.string(),
  region: z.string(),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string(),
  residentialAddress: z.string(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().optional(),
  emergencyContact: z.string(),
  emergencyMedicalContact: z.string().optional(),
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  feesAcknowledged: z.boolean().default(false),
  declarationSigned: z.boolean().default(false),
  signature: z.string().optional(),
  classification: z.string().optional(),
  submittedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  receivedDate: z.string().optional(),
  remarks: z.string().optional(),
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
});

// -------------------- GET by studentId --------------------
export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId } = params;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { application: { include: { previousSchools: true, familyMembers: true } } },
    });

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json({ student });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT update admission --------------------
export async function PUT(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId } = params;
    const body = await req.json();
    const data = AdmissionSchema.parse(body);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { application: true },
    });
    if (!student || !student.application) return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    const updatedAdmission = await prisma.$transaction(async (tx) => {
      await tx.previousSchools.deleteMany({ where: { applicationId: student.application.id } });
      await tx.familyMembers.deleteMany({ where: { applicationId: student.application.id } });

      return tx.application.update({
        where: { id: student.application.id },
        data: {
          classId: data.classId,
          surname: data.surname,
          firstName: data.firstName,
          otherNames: data.otherNames,
          dateOfBirth: new Date(data.dateOfBirth),
          nationality: data.nationality,
          sex: data.sex,
          languages: data.languages,
          mothersTongue: data.mothersTongue,
          religion: data.religion,
          denomination: data.denomination,
          hometown: data.hometown,
          region: data.region,
          profilePicture: data.profilePicture,
          wardLivesWith: data.wardLivesWith,
          numberOfSiblings: data.numberOfSiblings,
          siblingsOlder: data.siblingsOlder,
          siblingsYounger: data.siblingsYounger,
          postalAddress: data.postalAddress,
          residentialAddress: data.residentialAddress,
          wardMobile: data.wardMobile,
          wardEmail: data.wardEmail,
          emergencyContact: data.emergencyContact,
          emergencyMedicalContact: data.emergencyMedicalContact,
          medicalSummary: data.medicalSummary,
          bloodType: data.bloodType,
          specialDisability: data.specialDisability,
          feesAcknowledged: data.feesAcknowledged,
          declarationSigned: data.declarationSigned,
          signature: data.signature,
          classification: data.classification,
          submittedBy: data.submittedBy,
          receivedBy: data.receivedBy,
          receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
          remarks: data.remarks,
          previousSchools: { create: data.previousSchools || [] },
          familyMembers: { create: data.familyMembers || [] },
        },
      });
    });

    return NextResponse.json({ success: true, updatedAdmission });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
