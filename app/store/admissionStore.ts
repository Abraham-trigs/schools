// app/stores/admissionStore.ts
"use client";

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";
import { useAuthStore } from "./useAuthStore.ts";

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

export type GradeOption = {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
};

// ------------------ Step Fields ------------------
const STEP_FIELDS: string[][] = [
  ["surname", "firstName", "otherNames", "email", "password"], // Step 0
  ["dateOfBirth", "nationality", "sex"], // Step 1
  ["languages", "mothersTongue", "religion", "denomination", "hometown", "region"], // Step 2
  ["profilePicture", "wardLivesWith", "numberOfSiblings", "siblingsOlder", "siblingsYounger"], // Step 3
  ["postalAddress", "residentialAddress", "wardMobile", "emergencyContact", "emergencyMedicalContact"], // Step 4
  ["medicalSummary", "bloodType", "specialDisability"], // Step 5
  ["previousSchools", "familyMembers"], // Step 6
  ["feesAcknowledged", "declarationSigned", "signature", "classId", "gradeId"], // Step 7
];

// ------------------ Admission Store Schema ------------------
export const admissionFormSchema = z.object({
  applicationId: z.string().optional(),
  studentId: z.string().optional(),
  progress: z.number().default(0),
  // Step 0
  surname: z.string().optional(),
  firstName: z.string().optional(),
  otherNames: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  // Step 1
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
  // Step 2
  languages: z.array(z.string()).optional(),
  mothersTongue: z.string().optional(),
  religion: z.string().optional(),
  denomination: z.string().optional(),
  hometown: z.string().optional(),
  region: z.string().optional(),
  // Step 3
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().optional(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  // Step 4
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  wardMobile: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),
  // Step 5
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  // Step 6
  previousSchools: z.array(z.any()).optional(),
  familyMembers: z.array(z.any()).optional(),
  // Step 7
  feesAcknowledged: z.boolean().optional(),
  declarationSigned: z.boolean().optional(),
  signature: z.string().optional(),
  classId: z.string().optional(),
  gradeId: z.string().optional(),
});

// ------------------ Store Interface ------------------
interface AdmissionStore {
  formData: z.infer<typeof admissionFormSchema>;
  loading: boolean;
  errors: Record<string, string[]>;
  userCreated: boolean;

  setField: (field: string, value: any) => void;
  setErrors: (errors: Record<string, string[]>) => void;
  completeStep: (step: number) => Promise<boolean>;
  fetchAdmission: (applicationId: string) => Promise<void>;
  deleteAdmission: (applicationId: string) => Promise<boolean>;
  loadStudentData: (admission: any) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;

  // Class / grade helpers
  setClass: (classId: string, grades: GradeOption[]) => void;
  selectGrade: (gradeId?: string, grades?: GradeOption[]) => void;
}

// ------------------ Helpers ------------------
function calculateProgress(data: any) {
  let completedSteps = 0;
  STEP_FIELDS.forEach((fields) => {
    const stepComplete = fields.every((f) => {
      const value = data[f];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return value !== undefined && value !== null && value !== "";
    });
    if (stepComplete) completedSteps += 1;
  });
  return Math.round((completedSteps / STEP_FIELDS.length) * 100);
}

// ------------------ Store Implementation ------------------
export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: admissionFormSchema.partial().parse({}),
  loading: false,
  errors: {},
  userCreated: false,

  setField: (field, value) =>
    set((state) => {
      state.formData[field] = value;
      state.formData.progress = calculateProgress(state.formData);
      return { formData: state.formData };
    }),

  setErrors: (errors) => set({ errors }),

  completeStep: async (step) => {
    set({ loading: true, errors: {} });
    try {
      const payload: any = {};
      STEP_FIELDS[step].forEach((f) => (payload[f] = get().formData[f]));

      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      let res;
      if (step === 0) {
        res = await axios.post("/api/admissions", { ...payload, step }, { headers: { "X-School-ID": schoolId } });
        const admission = res.data.admission;
        set((state) => ({
          formData: { ...state.formData, studentId: admission.studentId, applicationId: admission.id },
          userCreated: true,
        }));
      } else {
        const appId = get().formData.applicationId;
        if (!appId) throw new Error("Application ID missing");
        res = await axios.patch(`/api/admissions/${appId}`, { ...payload, step }, { headers: { "X-School-ID": schoolId } });
      }

      set((state) => ({
        formData: { ...state.formData, progress: calculateProgress(state.formData) },
      }));

      return true;
    } catch (err: any) {
      set({ errors: { completeStep: [err?.response?.data?.error || err.message || "Step failed"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // admissionStore.ts
assignStudentClassGrade: async (studentId: string, classId: string, gradeId: string) => {
  set({ loading: true, errors: {} });
  try {
    // Update the student
    const schoolId = useAuthStore.getState().user?.school?.id;
    if (!schoolId) throw new Error("Unauthorized: missing school ID");

    const res = await axios.put(
      `/api/students/${studentId}`,
      { classId, gradeId },
      { headers: { "X-School-ID": schoolId } }
    );

    const updatedStudent = res.data.student;

    // Automatically update admission status
    let admissionStatus = updatedStudent.classId && updatedStudent.gradeId ? "Enrolled" : "Pending";

    // Update the admission record if exists
    if (updatedStudent.admissionId) {
      await axios.patch(
        `/api/admissions/${updatedStudent.admissionId}`,
        { classId, gradeId, admissionStatus },
        { headers: { "X-School-ID": schoolId } }
      );
    }

    // Update local state
    set((state) => ({
      formData: {
        ...state.formData,
        classId,
        gradeId,
      },
    }));

    // Optimistic UI update in student store
    useStudentStore.setState((state) => ({
      students: state.students.map((s) => (s.id === studentId ? updatedStudent : s)),
      studentDetail: state.studentDetail?.id === studentId ? updatedStudent : state.studentDetail,
    }));

    return updatedStudent;
  } catch (err: any) {
    set({ errors: { assignStudentClassGrade: [err?.response?.data?.error || err.message || "Update failed"] } });
    throw err;
  } finally {
    set({ loading: false });
  }
},


  fetchAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");
      const res = await axios.get(`/api/admissions/${applicationId}`, { headers: { "X-School-ID": schoolId } });
      get().loadStudentData(res.data.application || res.data);
    } catch (err: any) {
      set({ errors: { fetchAdmission: [err?.response?.data?.error || err.message || "Fetch failed"] } });
    } finally {
      set({ loading: false });
    }
  },

  deleteAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");
      await axios.delete(`/api/admissions/${applicationId}`, { headers: { "X-School-ID": schoolId } });
      set({ formData: admissionFormSchema.partial().parse({}), userCreated: false });
      return true;
    } catch (err: any) {
      set({ errors: { deleteAdmission: [err?.response?.data?.error || err.message || "Delete failed"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  loadStudentData: (admission) => {
    if (!admission) return;
    const formData: any = { ...admission };
    formData.progress = calculateProgress(formData);
    set({ formData, userCreated: true });
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

  // ------------------ Class / Grade Logic ------------------
  setClass: (classId: string, grades: GradeOption[]) => {
    const availableGrade = grades.find((g) => g.enrolled < g.capacity);
    set((state) => ({
      formData: {
        ...state.formData,
        classId,
        gradeId: availableGrade?.id,
        progress: calculateProgress({ ...state.formData, classId, gradeId: availableGrade?.id }),
      },
    }));
  },

  selectGrade: (gradeId?: string, grades?: GradeOption[]) => {
    if (gradeId) {
      set((state) => ({
        formData: {
          ...state.formData,
          gradeId,
          progress: calculateProgress({ ...state.formData, gradeId }),
        },
      }));
    } else if (grades) {
      const availableGrade = grades.find((g) => g.enrolled < g.capacity);
      set((state) => ({
        formData: {
          ...state.formData,
          gradeId: availableGrade?.id,
          progress: calculateProgress({ ...state.formData, gradeId: availableGrade?.id }),
        },
      }));
    }
  },
}));

// ------------------ Notes ------------------
// Tracks all steps, fields, and dynamic arrays (family/previous schools).
// Auto-selects grades with capacity and calculates progress automatically.
// Integrates seamlessly with multi-step admission form.
