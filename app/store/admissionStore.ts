"use client";

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";
import { useClassesStore } from "./useClassesStore.ts";
import { useAuthStore } from "./useAuthStore.ts";
import { API_ENDPOINTS } from "@/lib/api/endpoints.ts";

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
  startDate: string;
  endDate: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
};

// ------------------ Nested Zod Schemas ------------------
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

// ------------------ Form Schema ------------------
export const admissionFormSchema = z.object({
  admissionPin: z.string(),
  studentId: z.string().optional(),
  classId: z.string().optional(),
  surname: z.string().optional(),
  firstName: z.string().optional(),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().optional(),
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
  wardEmail: z.string().optional(),
  emergencyContact: z.string().optional(),
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

// ------------------ Store Interface ------------------
interface AdmissionStore {
  formData: z.infer<typeof admissionFormSchema>;
  availableClasses: SchoolClass[];
  loading: boolean;
  errors: Record<string, string[]>;
  submitted: boolean;
  userCreated: boolean;

  setField: (field: string, value: any) => void;
  markUserCreated: (studentId: string) => void;

  createUser: (payload?: { name: string; email: string; password?: string; role?: string }) => Promise<any>;
  submitForm: () => Promise<void>;
  updateAdmission: (updatedFields?: Partial<z.infer<typeof admissionFormSchema>>) => Promise<void>;
  fetchStudentAdmission: (studentId: string) => Promise<void>;
  fetchClasses: () => Promise<void>;

  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;

  loadStudentData: (student: any) => void;
}

// ------------------ Store ------------------
export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: admissionFormSchema.parse({ admissionPin: "" }),
  availableClasses: [],
  loading: false,
  errors: {},
  submitted: false,
  userCreated: false,

  // ------------------ Field Setter ------------------
  setField: (field, value) => {
    set((state) => {
      const keys = field.split(".");
      let obj: any = state.formData;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return { formData: state.formData };
    });
  },

  markUserCreated: (studentId: string) => {
    set((state) => ({ formData: { ...state.formData, studentId }, userCreated: true }));
  },

  // ------------------ Create User ------------------
  createUser: async (payload) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const data = payload || {
        name: `${get().formData.firstName} ${get().formData.surname}`,
        email: get().formData.wardEmail,
        role: "STUDENT",
      };

      const res = await axios.post(API_ENDPOINTS.users, data, {
        headers: { "X-School-ID": schoolId },
      });

      set({ formData: { ...get().formData, studentId: res.data.id }, userCreated: true });
      return res.data;
    } catch (err: any) {
      set({ errors: { createUser: [err.response?.data?.error || err.message || "Failed to create user"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ Submit Admission ------------------
  submitForm: async () => {
    if (!get().userCreated) {
      set({ errors: { submitForm: ["User must be created first."] } });
      return;
    }

    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      await axios.post(API_ENDPOINTS.admissions, get().formData, {
        headers: { "X-School-ID": schoolId },
      });

      set({ submitted: true });
    } catch (err: any) {
      set({ errors: { submitForm: [err.response?.data?.error || err.message || "Failed to submit admission"] } });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ Update Admission ------------------
  updateAdmission: async (updatedFields) => {
    const studentId = get().formData.studentId;
    if (!studentId) {
      set({ errors: { updateAdmission: ["Student ID missing"] } });
      return;
    }

    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const body = { ...get().formData, ...updatedFields };
      await axios.put(`${API_ENDPOINTS.admissions}/${studentId}`, body, {
        headers: { "X-School-ID": schoolId },
      });

      set({ formData: body });
    } catch (err: any) {
      set({ errors: { updateAdmission: [err.response?.data?.error || err.message || "Failed to update admission"] } });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ Fetch Student Admission ------------------
  fetchStudentAdmission: async (studentId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const res = await axios.get(`${API_ENDPOINTS.admissions}/${studentId}`, {
        headers: { "X-School-ID": schoolId },
      });

      get().loadStudentData(res.data.student);
    } catch (err: any) {
      set({ errors: { fetchStudentAdmission: [err.response?.data?.error || err.message || "Failed to fetch admission"] } });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ Fetch Classes ------------------
  fetchClasses: async () => {
    try {
      await useClassesStore.getState().fetchClasses(1, 100);
      set({ availableClasses: useClassesStore.getState().classes });
    } catch (err) {
      console.error(err);
      set({ availableClasses: [] });
    }
  },

  // ------------------ Family Members ------------------
  addFamilyMember: (member) =>
    set((state) => ({
      formData: { ...state.formData, familyMembers: [...(state.formData.familyMembers || []), member] },
    })),
  removeFamilyMember: (idx) =>
    set((state) => ({
      formData: {
        ...state.formData,
        familyMembers: state.formData.familyMembers?.filter((_, i) => i !== idx),
      },
    })),

  // ------------------ Previous Schools ------------------
  addPreviousSchool: (school) =>
    set((state) => ({
      formData: { ...state.formData, previousSchools: [...(state.formData.previousSchools || []), school] },
    })),
  removePreviousSchool: (idx) =>
    set((state) => ({
      formData: { ...state.formData, previousSchools: state.formData.previousSchools?.filter((_, i) => i !== idx) },
    })),

  // ------------------ Load Student Data ------------------
  loadStudentData: (student) => {
    if (!student.admission) return;
    const admission = student.admission;
    set({
      formData: {
        ...get().formData,
        studentId: student.id,
        classId: student.classId || admission.classId,
        surname: admission.surname,
        firstName: admission.firstName,
        otherNames: admission.otherNames,
        dateOfBirth: admission.dateOfBirth,
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
        wardEmail: student.email,
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
        receivedDate: admission.receivedDate,
        remarks: admission.remarks,
        previousSchools: admission.previousSchools || [],
        familyMembers: admission.familyMembers || [],
      },
      userCreated: true,
    });
  },
}));
