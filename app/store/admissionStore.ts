"use client";

// app/stores/useAdmissionStore.ts
// Store for managing student admission form with step-wise backend sync.

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";
import { useClassesStore } from "./useClassesStore";
import { useAuthStore } from "./useAuthStore";

// ------------------ Types ------------------
export type FamilyMember = {
  relation: string;
  name: string;
  postalAddress: string;
  residentialAddress: string;
  phone?: string;
  email?: string;
  occupation?: string;
  workplace?: string;
  religion?: string;
  isAlive?: boolean;
};

export type PreviousSchool = {
  name: string;
  location: string;
  startDate: string | Date;
  endDate: string | Date;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
};

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

export const admissionFormSchema = z.object({
  applicationId: z.string().optional(),
  studentId: z.string().optional(),
  admissionPin: z.string().optional(),
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
  progress: z.number().default(0),
});

// ------------------ Step Definitions ------------------
const STEP_FIELDS: string[][] = [
  // Step 1: User + Student + minimal Application
  ["surname", "firstName", "wardEmail", "dateOfBirth", "nationality", "sex", "classId"],
  
  // Step 2: Personal & linguistic info
  ["languages", "mothersTongue", "religion", "denomination", "hometown", "region"],
  
  // Step 3: Ward details
  ["profilePicture", "wardLivesWith", "numberOfSiblings", "siblingsOlder", "siblingsYounger"],
  
  // Step 4: Contact & emergency info
  ["postalAddress", "residentialAddress", "wardMobile", "wardEmail", "emergencyContact", "emergencyMedicalContact"],
  
  // Step 5: Medical info
  ["medicalSummary", "bloodType", "specialDisability"],
  
  // Step 6: Previous schools & family
  ["previousSchools", "familyMembers"],
  
  // Step 7: Fees & declaration
  ["feesAcknowledged", "declarationSigned", "signature"],
];


// ------------------ Helper: Progress Calculation ------------------
function calculateProgress(formData: any) {
  let completedSteps = 0;
  STEP_FIELDS.forEach((fields) => {
    const stepComplete = fields.every((field) => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return value !== undefined && value !== null && value !== "";
    });
    if (stepComplete) completedSteps += 1;
  });
  return Math.round((completedSteps / STEP_FIELDS.length) * 100);
}

// ------------------ Store Interface ------------------
interface AdmissionStore {
  formData: z.infer<typeof admissionFormSchema>;
  availableClasses: SchoolClass[];
  loading: boolean;
  errors: Record<string, string[]>;
  userCreated: boolean;

  setField: (field: string, value: any) => void;
  setErrors: (errors: Record<string, string[]>) => void;

  completeStep: (step: number) => Promise<boolean>;
  fetchStudentAdmission: (applicationId: string) => Promise<void>;
  deleteAdmission: (applicationId: string) => Promise<boolean>;
  fetchClasses: () => Promise<void>;
  loadStudentData: (admission: any) => void;

  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;
}

// ------------------ Store Implementation ------------------
export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: admissionFormSchema.partial().parse({ admissionPin: "" }),
  availableClasses: [],
  loading: false,
  errors: {},
  userCreated: false,

  setField: (field, value) => {
    set((state) => {
      const keys = field.split(".");
      let obj: any = state.formData;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      state.formData.progress = calculateProgress(state.formData);
      return { formData: state.formData };
    });
  },

  setErrors: (errors) => set({ errors }),

  // ------------------ Complete Step ------------------
  completeStep: async (step) => {
    set({ loading: true, errors: {} });
    try {
      const stepFields = STEP_FIELDS[step - 1];
      const payload: any = {};
      stepFields.forEach((f) => (payload[f] = get().formData[f]));

      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      if (step === 1) {
        // Step 1 = create user + student + application
        const res = await axios.post("/api/admissions", payload, { headers: { "X-School-ID": schoolId } });
        const app = res.data.admission;
        set((state) => ({
          formData: { ...state.formData, studentId: app.studentId, applicationId: app.id },
          userCreated: true,
        }));
      } else {
        // Steps 2-8 = patch existing admission
        const appId = get().formData.applicationId;
        if (!appId) throw new Error("Application ID missing");

        await axios.patch(`/api/admissions/${appId}`, payload, { headers: { "X-School-ID": schoolId } });
      }

      // Recalculate progress locally
      set((state) => {
        const formWithProgress = { ...state.formData, progress: calculateProgress(state.formData) };
        return { formData: formWithProgress };
      });

      return true;
    } catch (err: any) {
      set({ errors: { completeStep: [err?.response?.data?.error || err.message || "Step failed"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ Fetch Admission ------------------
  fetchStudentAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const res = await axios.get(`/api/admissions/${applicationId}`, { headers: { "X-School-ID": schoolId } });
      get().loadStudentData(res.data.admission || res.data);
    } catch (err: any) {
      set({ errors: { fetchStudentAdmission: [err.response?.data?.error || err.message || "Failed to fetch admission"] } });
    } finally {
      set({ loading: false });
    }
  },

  deleteAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      await axios.delete(`/api/admissions/${applicationId}`, { headers: { "X-School-ID": schoolId } });
      set({ formData: admissionFormSchema.partial().parse({ admissionPin: "" }), userCreated: false });
      return true;
    } catch (err: any) {
      set({ errors: { deleteAdmission: [err.response?.data?.error || err.message || "Failed to delete admission"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchClasses: async () => {
    try {
      await useClassesStore.getState().fetchClasses(1, 100);
      set({ availableClasses: useClassesStore.getState().classes });
    } catch (err) {
      console.error(err);
      set({ availableClasses: [] });
    }
  },

  addFamilyMember: (member) =>
    set((state) => {
      const updated = [...(state.formData.familyMembers || []), member];
      const formWithProgress = { ...state.formData, familyMembers: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  removeFamilyMember: (idx) =>
    set((state) => {
      const updated = state.formData.familyMembers?.filter((_, i) => i !== idx) || [];
      const formWithProgress = { ...state.formData, familyMembers: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  addPreviousSchool: (school) =>
    set((state) => {
      const updated = [...(state.formData.previousSchools || []), school];
      const formWithProgress = { ...state.formData, previousSchools: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  removePreviousSchool: (idx) =>
    set((state) => {
      const updated = state.formData.previousSchools?.filter((_, i) => i !== idx) || [];
      const formWithProgress = { ...state.formData, previousSchools: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  loadStudentData: (admission) => {
    if (!admission) return;
    const formData = {
      applicationId: admission.id,
      studentId: admission.student?.id,
      classId: admission.student?.classId || "",
      surname: admission.surname,
      firstName: admission.firstName,
      otherNames: admission.otherNames,
      dateOfBirth: new Date(admission.dateOfBirth),
      nationality: admission.nationality,
      sex: admission.sex,
      languages: admission.languages,
      mothersTongue: admission.mothersTongue,
      religion: admission.religion,
      denomination: admission.denomination,
      hometown: admission.hometown,
      region: admission.region,
      profilePicture: admission.profilePicture,
      wardLivesWith: admission.wardLivesWith,
      numberOfSiblings: admission.numberOfSiblings,
      siblingsOlder: admission.siblingsOlder,
      siblingsYounger: admission.siblingsYounger,
      postalAddress: admission.postalAddress,
      residentialAddress: admission.residentialAddress,
      wardMobile: admission.wardMobile,
      wardEmail: admission.student?.user?.email,
      emergencyContact: admission.emergencyContact,
      emergencyMedicalContact: admission.emergencyMedicalContact,
      medicalSummary: admission.medicalSummary,
      bloodType: admission.bloodType,
      specialDisability: admission.specialDisability,
      feesAcknowledged: admission.feesAcknowledged,
      declarationSigned: admission.declarationSigned,
      signature: admission.signature,
      classification: admission.classification,
      submittedBy: admission.submittedBy,
      receivedBy: admission.receivedBy,
      receivedDate: admission.receivedDate ? new Date(admission.receivedDate) : null,
      remarks: admission.remarks,
      previousSchools: admission.previousSchools || [],
      familyMembers: admission.familyMembers || [],
    };
    formData.progress = calculateProgress(formData);
    set({ formData, userCreated: true });
  },
}));



// ✅ Design Reasoning

// Step 1 ensures user, student, and minimal application creation.

// Steps 2–6 and 8 are partial updates, mapped explicitly to field groups.

// Step 7 bulk replaces nested arrays (previousSchools and familyMembers) in line with the backend PATCH route.

// Progress is calculated after every step.

// Structure

// formData – Holds all fields.

// STEP_FIELDS – Explicit step-to-field mapping.

// completeStep(step: number) – Central method to sync step with backend.

// Helpers for family/previous school array updates.

// Load, fetch, delete admission and fetch classes.

// Implementation Guidance

// Call completeStep(stepNumber) after each step.

// Step 1 triggers creation, subsequent steps trigger PATCH.

// Use loadStudentData to populate store from backend.

// Scalability Insight

// New steps or nested arrays can be added by updating STEP_FIELDS and backend accordingly.

// completeStep abstracts step-wise sync, making it future-proof for multi-step forms.
