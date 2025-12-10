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
  classId?: string;
  gradeId?: string;
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
  userId: string;
  name: string;
  email: string;
  classId?: string;
  gradeId?: string;
  admission?: AdmissionData;
  Class?: { id: string; name: string };
  Grade?: { id: string; name: string };
  attendance?: any[];
  exams?: any[];
};

export type StudentListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  classId?: string;
  gradeId?: string;
};

// ------------------ Store Interface ------------------
interface StudentStore {
  profile: StudentProfile | null;
  loadingProfile: boolean;
  profileErrors: string[];

  students: StudentListItem[];
  loadingList: boolean;
  listErrors: string[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };

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
      const students: StudentListItem[] = res.data.students.map((s: any) => ({
        id: s.id,
        userId: s.userId,
        name: [s.user.firstName, s.user.surname, s.user.otherNames].filter(Boolean).join(" "),
        email: s.user.email,
        classId: s.Class?.id,
        gradeId: s.Grade?.id,
      }));

      set({
        students,
        pagination: res.data.pagination || { page, perPage, total: 0, totalPages: 1 },
      });
    } catch (err: any) {
      set({ listErrors: [err.response?.data?.error || err.message] });
    } finally {
      set({ loadingList: false });
    }
  },

  clearStudents: () =>
    set({
      students: [],
      pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },
      listErrors: [],
    }),
}));
