import { create } from "zustand";
import { z } from "zod";
import { debounce } from "lodash";

// =====================
// TypeScript interfaces
// =====================
export interface FamilyMember {
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
}

export interface PreviousSchool {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface AdmissionFormData {
  studentId: string;
  classId: string;
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
  profilePicture?: string;
  wardLivesWith: string;
  numberOfSiblings?: number;
  siblingsOlder?: number;
  siblingsYounger?: number;
  postalAddress: string;
  residentialAddress: string;
  wardMobile?: string;
  wardEmail?: string;
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
  admissionPin: string;
  grade?: string; // synced from selected class
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
}

// =====================
// Zod validation schema
// =====================
export const FamilyMemberSchema = z.object({
  relation: z.string().min(1),
  name: z.string().min(1),
  postalAddress: z.string().min(1),
  residentialAddress: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  religion: z.string().optional(),
  isAlive: z.boolean().optional(),
});

export const PreviousSchoolSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const AdmissionFormSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  surname: z.string().min(1),
  firstName: z.string().min(1),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().min(1),
  nationality: z.string().min(1),
  sex: z.string().min(1),
  languages: z.array(z.string()),
  mothersTongue: z.string().min(1),
  religion: z.string().min(1),
  denomination: z.string().optional(),
  hometown: z.string().min(1),
  region: z.string().min(1),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().min(1),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string().min(1),
  residentialAddress: z.string().min(1),
  wardMobile: z.string().optional(),
  wardEmail: z.string().email().optional(),
  emergencyContact: z.string().min(1),
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
  admissionPin: z.string().min(1),
});

// =====================
// Zustand store
// =====================
interface AdmissionStore {
  formData: AdmissionFormData;
  availableClasses: SchoolClass[];
  errors: Record<string, string[]>;
  loading: boolean;
  submitted: boolean;
  currentStep: number;
  totalSteps: number;

  // actions
  setField: <K extends keyof AdmissionFormData>(field: K, value: AdmissionFormData[K]) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (index: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (index: number) => void;
  fetchClasses: (search?: string) => Promise<void>;
  submitForm: () => Promise<void>;
  resetForm: () => void;

  // multi-step
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  validateCurrentStep: () => boolean;
}

export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: {
    studentId: "",
    classId: "",
    surname: "",
    firstName: "",
    otherNames: "",
    dateOfBirth: "",
    nationality: "",
    sex: "",
    languages: [],
    mothersTongue: "",
    religion: "",
    denomination: "",
    hometown: "",
    region: "",
    profilePicture: "",
    wardLivesWith: "",
    numberOfSiblings: undefined,
    siblingsOlder: undefined,
    siblingsYounger: undefined,
    postalAddress: "",
    residentialAddress: "",
    wardMobile: "",
    wardEmail: "",
    emergencyContact: "",
    emergencyMedicalContact: "",
    medicalSummary: "",
    bloodType: "",
    specialDisability: "",
    feesAcknowledged: false,
    declarationSigned: false,
    signature: "",
    classification: "",
    submittedBy: "",
    receivedBy: "",
    receivedDate: "",
    remarks: "",
    previousSchools: [],
    familyMembers: [],
    admissionPin: "",
    grade: "",
  },
  availableClasses: [],
  errors: {},
  loading: false,
  submitted: false,
  currentStep: 1,
  totalSteps: 4,

  setField: (field, value) => set((state) => {
    const newFormData = { ...state.formData, [field]: value };
    if (field === "classId") {
      const cls = state.availableClasses.find(c => c.id === value);
      if (cls) newFormData.grade = cls.name;
    }
    return { formData: newFormData };
  }),

  addFamilyMember: (member) => set((state) => ({ formData: { ...state.formData, familyMembers: [...(state.formData.familyMembers || []), member] } })),
  removeFamilyMember: (index) => set((state) => {
    const fm = [...(state.formData.familyMembers || [])];
    fm.splice(index, 1);
    return { formData: { ...state.formData, familyMembers: fm } };
  }),

  addPreviousSchool: (school) => set((state) => ({ formData: { ...state.formData, previousSchools: [...(state.formData.previousSchools || []), school] } })),
  removePreviousSchool: (index) => set((state) => {
    const ps = [...(state.formData.previousSchools || [])];
    ps.splice(index, 1);
    return { formData: { ...state.formData, previousSchools: ps } };
  }),

  fetchClasses: debounce(async (search = "") => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/classes?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      set({ availableClasses: data.classes || [], loading: false });
    } catch {
      set({ availableClasses: [], loading: false });
    }
  }, 300),

  submitForm: async () => {
    set({ loading: true, errors: {}, submitted: false });
    try {
      AdmissionFormSchema.parse(get().formData);
      const res = await fetch("/api/admissions", { method: "POST", body: JSON.stringify(get().formData), headers: { "Content-Type": "application/json" } });
      const result = await res.json();
      if (!res.ok) set({ errors: result.error || {}, loading: false });
      else set({ submitted: true, loading: false });
    } catch (err: any) {
      if (err instanceof z.ZodError) set({ errors: err.flatten().fieldErrors, loading: false });
      else set({ errors: { form: [err.message] }, loading: false });
    }
  },

  resetForm: () => set({
    formData: {
      studentId: "",
      classId: "",
      surname: "",
      firstName: "",
      otherNames: "",
      dateOfBirth: "",
      nationality: "",
      sex: "",
      languages: [],
      mothersTongue: "",
      religion: "",
      denomination: "",
      hometown: "",
      region: "",
      profilePicture: "",
      wardLivesWith: "",
      numberOfSiblings: undefined,
      siblingsOlder: undefined,
      siblingsYounger: undefined,
      postalAddress: "",
      residentialAddress: "",
      wardMobile: "",
      wardEmail: "",
      emergencyContact: "",
      emergencyMedicalContact: "",
      medicalSummary: "",
      bloodType: "",
      specialDisability: "",
      feesAcknowledged: false,
      declarationSigned: false,
      signature: "",
      classification: "",
      submittedBy: "",
      receivedBy: "",
      receivedDate: "",
      remarks: "",
      previousSchools: [],
      familyMembers: [],
      admissionPin: "",
      grade: "",
    },
    errors: {},
    loading: false,
    submitted: false,
    currentStep: 1,
  }),

  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, state.totalSteps) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  goToStep: (step: number) => set({ currentStep: Math.min(Math.max(step, 1), get().totalSteps) }),

  validateCurrentStep: () => {
    const { currentStep, formData } = get();
    try {
      switch (currentStep) {
        case 1:
          z.object({
            surname: z.string().min(1),
            firstName: z.string().min(1),
            dateOfBirth: z.string().min(1),
            sex: z.string().min(1),
          }).parse(formData);
          break;
        case 2:
          z.array(FamilyMemberSchema).parse(formData.familyMembers || []);
          break;
        case 3:
          z.array(PreviousSchoolSchema).parse(formData.previousSchools || []);
          break;
        case 4:
          z.string().min(1).parse(formData.admissionPin);
          break;
      }
      return true;
    } catch {
      return false;
    }
  },
}));

// =====================
// Design reasoning
// =====================
// Centralized multi-step store keeps state, validation, class selection, and submission logic consistent. Grade auto-sync ensures reporting clarity. Nested arrays (familyMembers, previousSchools) directly managed for user-friendly UX.

// =====================
// Structure
// =====================
// - useAdmissionStore: main Zustand store hook
// - Actions: setField, add/remove nested items, fetchClasses, submitForm, resetForm
// - Multi-step: nextStep, prevStep, goToStep, validateCurrentStep
// - State: formData, availableClasses, errors, loading, submitted, currentStep, totalSteps

// =====================
// Implementation guidance
// =====================
// - Bind form fields to store.setField
// - Call store.fetchClasses() on component mount/search
// - Validate step before moving to nextStep using validateCurrentStep()
// - Call submitForm() at final step to persist admission

// =====================
// Scalability insight
// =====================
// - Supports dynamic multi-step forms, autosave drafts, notifications, and caching available classes per grade. Easily extendable for more nested objects or step-based conditional logic.
