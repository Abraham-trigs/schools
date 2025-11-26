// app/store/studentStore.ts
"use client";

import { create } from "zustand";
import axios from "axios";

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

export type AdmissionData = {
  id: string;
  studentId: string;
  classId: string;
  profilePicture?: string;
  surname: string;
  firstName: string;
  otherNames?: string;
  dateOfBirth: string;
  nationality: string;
  sex: string;
  languages: string[];
  mothersTongue: string;
  religion: string;
  denomination?: string;
  hometown: string;
  region: string;
  wardLivesWith: string;
  postalAddress: string;
  residentialAddress: string;
  emergencyContact: string;
  emergencyMedicalContact?: string;
  medicalSummary?: string;
  bloodType?: string;
  specialDisability?: string;
  feesAcknowledged: boolean;
  declarationSigned: boolean;
  signature?: string;
  classification?: string;
  submittedBy?: string;
  receivedBy?: string;
  receivedDate?: string;
  remarks?: string;
  previousSchools?: PreviousSchool[];
  familyMembers?: FamilyMember[];
};

export type StudentProfile = {
  id: string;
  name: string;
  email: string;
  classId?: string;
  admission?: AdmissionData;
  grades?: any[];
  attendance?: any[];
  exams?: any[];
};

export type StudentListItem = {
  id: string;
  name: string;
  email: string;
  classId?: string;
  admission?: AdmissionData;
};

// ------------------ Store Interface ------------------
interface StudentStore {
  // Single student
  profile: StudentProfile | null;
  loadingProfile: boolean;
  profileErrors: string[];

  // List of students
  students: StudentListItem[];
  loadingList: boolean;
  listErrors: string[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };

  // Actions
  fetchProfile: (studentId: string) => Promise<void>;
  clearProfile: () => void;

  fetchStudents: (page?: number, perPage?: number, search?: string) => Promise<void>;
  clearStudents: () => void;
}

// ------------------ Store ------------------
export const useStudentStore = create<StudentStore>((set, get) => ({
  profile: null,
  loadingProfile: false,
  profileErrors: [],

  students: [],
  loadingList: false,
  listErrors: [],
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },

  // ------------------ Single Student ------------------
  fetchProfile: async (studentId: string) => {
    set({ loadingProfile: true, profileErrors: [] });
    try {
      const res = await axios.get(`/api/students/${studentId}`);
      set({ profile: res.data.student });
    } catch (err: any) {
      set({ profileErrors: [err.response?.data?.error || err.message] });
    } finally {
      set({ loadingProfile: false });
    }
  },

  clearProfile: () => set({ profile: null, profileErrors: [] }),

  // ------------------ Student List ------------------
  fetchStudents: async (page = 1, perPage = 20, search = "") => {
    set({ loadingList: true, listErrors: [] });
    try {
      const res = await axios.get(`/api/students?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`);
      set({
        students: res.data.students || [],
        pagination: res.data.pagination || { page, perPage, total: 0, totalPages: 1 },
      });
    } catch (err: any) {
      set({ listErrors: [err.response?.data?.error || err.message] });
    } finally {
      set({ loadingList: false });
    }
  },

  clearStudents: () => set({ students: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 }, listErrors: [] }),
}));
