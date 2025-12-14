// app/stores/admissionStore.ts
// Purpose: Client-side Zustand store for multi-step student admissions
// Fully integrated with updateAdmissionClient helper, optimistic updates, and step normalization

"use client";

import { create } from "zustand";
import { z } from "zod";
import { useAuthStore } from "./useAuthStore.ts";
import { useClassesStore } from "./useClassesStore.ts";
import {
  StepSchemas,
  FamilyMemberSchema,
  PreviousSchoolSchema,
  calculateProgress,
} from "@/lib/helpers/admission.ts";
import { updateAdmissionClient } from "@/lib/helpers/admissionClient.ts";

export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type PreviousSchool = z.infer<typeof PreviousSchoolSchema>;

export type GradeOption = {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
};

export const admissionFormSchema = z.object({
  applicationId: z.string().optional(),
  studentId: z.string().optional(),
  progress: z.number().default(0),

  surname: z.string().optional(),
  firstName: z.string().optional(),
  otherNames: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),

  dateOfBirth: z.union([z.string(), z.date()]).optional(),
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
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),

  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),

  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),

  feesAcknowledged: z.boolean().optional(),
  declarationSigned: z.boolean().optional(),
  signature: z.string().optional(),

  classId: z.string().optional(),
  className: z.string().optional(),
  gradeId: z.string().optional(),
  gradeName: z.string().optional(),
});

export type AdmissionFormData = z.infer<typeof admissionFormSchema>;

interface AdmissionStore {
  formData: AdmissionFormData;
  loading: boolean;
  errors: Record<string, string[]>;
  userCreated: boolean;

  setField: (field: keyof AdmissionFormData, value: any) => void;
  setErrors: (errors: Record<string, string[]>) => void;

  completeStep: (step: number) => Promise<boolean>;
  fetchAdmission: (applicationId: string) => Promise<void>;
  deleteAdmission: (applicationId: string) => Promise<boolean>;
  loadStudentData: (admission: any) => void;

  optimisticUpdate: <T>(
    field: keyof AdmissionFormData,
    updateFn: (prev: T) => T,
    apiCall?: () => Promise<void>
  ) => void;

  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;

  setClass: (classId: string, grades: GradeOption[]) => void;
  selectGrade: (gradeId?: string, grades?: GradeOption[]) => void;
}

// ---------------------- Normalize Step Data ----------------------
function normalizeStepData(step: number, data: AdmissionFormData) {
  const stepData: any = {};
  Object.keys(StepSchemas[step].shape).forEach((key) => {
    stepData[key] = data[key as keyof AdmissionFormData];
  });

  if (step === 1 && stepData.dateOfBirth) {
    stepData.dateOfBirth = new Date(stepData.dateOfBirth);
  }

  if (step === 6 && stepData.previousSchools) {
    stepData.previousSchools = stepData.previousSchools.map((s: any) => ({
      ...s,
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
    }));
  }

  return stepData;
}

// ---------------------- Admission Store ----------------------
export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: admissionFormSchema.parse({}),
  loading: false,
  errors: {},
  userCreated: false,

  setField: (field, value) =>
    set((state) => {
      const updated = { ...state.formData, [field]: value };
      updated.progress = calculateProgress(updated);
      return { formData: updated };
    }),

  setErrors: (errors) => set({ errors }),

  // ---------------------- Universal Optimistic Update ----------------------
  optimisticUpdate: (field, updateFn, apiCall) => {
    const prev = get().formData[field];

    // Optimistic update
    set((state) => {
      const updated = updateFn(prev);
      return {
        formData: { ...state.formData, [field]: updated, progress: calculateProgress({ ...state.formData, [field]: updated }) },
      };
    });

    // Rollback if API fails
    if (apiCall) {
      apiCall().catch((err: any) => {
        set((state) => ({
          formData: { ...state.formData, [field]: prev, progress: calculateProgress({ ...state.formData, [field]: prev }) },
          errors: { [field]: [err?.message || "Update failed"] },
        }));
      });
    }
  },

  completeStep: async (step) => {
    set({ loading: true, errors: {} });

    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized");

      const payload = normalizeStepData(step, get().formData);

      if (step === 0) {
        if (get().userCreated && get().formData.applicationId) {
          await updateAdmissionClient(get().formData.applicationId, 0, payload);
        } else {
          const res = await updateAdmissionClient(null, 0, payload, true);
          set((state) => ({
            formData: {
              ...state.formData,
              applicationId: res.admission.id,
              studentId: res.admission.studentId,
            },
            userCreated: true,
          }));
        }
      } else {
        const appId = get().formData.applicationId;
        if (!appId) throw new Error("Missing applicationId for update");
        await updateAdmissionClient(appId, step, payload);
      }

      set((state) => ({
        formData: { ...state.formData, progress: calculateProgress(state.formData) },
      }));

      return true;
    } catch (err: any) {
      set({
        errors: { completeStep: [err?.message || "Step update failed"] },
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized");

      const data = await updateAdmissionClient(applicationId, undefined, undefined, false, true);

      const classesStore = useClassesStore.getState();
      const selectedClass = classesStore.classes.find(c => c.id === data.classId);
      const selectedGrade = selectedClass?.grades?.find(g => g.id === data.gradeId);
      data.className = selectedClass?.name;
      data.gradeName = selectedGrade?.name;

      get().loadStudentData(data);
    } catch (err: any) {
      set({ errors: { fetchAdmission: [err.message || "Fetch failed"] } });
    } finally {
      set({ loading: false });
    }
  },

  deleteAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      await updateAdmissionClient(applicationId, undefined, undefined, false, false, "DELETE");
      set({ formData: admissionFormSchema.parse({}), userCreated: false });
      return true;
    } catch (err: any) {
      set({ errors: { deleteAdmission: [err.message || "Delete failed"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  loadStudentData: (admission) => {
    if (!admission) return;

    const classesStore = useClassesStore.getState();
    let className: string | undefined;
    let gradeName: string | undefined;

    if (admission.classId) {
      const selectedClass = classesStore.classes.find(c => c.id === admission.classId);
      className = selectedClass?.name;

      const gradeList = selectedClass?.grades || [];
      if (admission.gradeId) {
        const selectedGrade = gradeList.find(g => g.id === admission.gradeId);
        gradeName = selectedGrade?.name;
      } else {
        const firstAvailableGrade = gradeList.find(g => g.enrolled < g.capacity);
        gradeName = firstAvailableGrade?.name;
      }
    }

    set({ formData: { ...admission, className, gradeName, progress: calculateProgress(admission) }, userCreated: true });
  },

  addFamilyMember: (member) => {
    get().optimisticUpdate(
      "familyMembers",
      (prev = []) => [...prev, member],
      () => updateAdmissionClient(get().formData.applicationId!, 6, { familyMembers: [...(get().formData.familyMembers || []), member] })
    );
  },

  removeFamilyMember: (idx) => {
    get().optimisticUpdate(
      "familyMembers",
      (prev = []) => prev.filter((_, i) => i !== idx),
      () => updateAdmissionClient(get().formData.applicationId!, 6, { familyMembers: [...(get().formData.familyMembers || [])].filter((_, i) => i !== idx) })
    );
  },

  addPreviousSchool: (school) => {
    get().optimisticUpdate(
      "previousSchools",
      (prev = []) => [...prev, school],
      () => updateAdmissionClient(get().formData.applicationId!, 6, { previousSchools: [...(get().formData.previousSchools || []), school] })
    );
  },

  removePreviousSchool: (idx) => {
    get().optimisticUpdate(
      "previousSchools",
      (prev = []) => prev.filter((_, i) => i !== idx),
      () => updateAdmissionClient(get().formData.applicationId!, 6, { previousSchools: [...(get().formData.previousSchools || [])].filter((_, i) => i !== idx) })
    );
  },

  setClass: (classId, grades) => {
    const classesStore = useClassesStore.getState();
    const selectedClass = classesStore.classes.find(c => c.id === classId);
    if (!selectedClass) return;

    const gradeList = grades || selectedClass.grades || [];
    const grade = gradeList.find(g => g.enrolled < g.capacity);

    set((state) => ({
      formData: {
        ...state.formData,
        classId,
        className: selectedClass.name,
        gradeId: grade?.id,
        gradeName: grade?.name,
        progress: calculateProgress({
          ...state.formData,
          classId,
          className: selectedClass.name,
          gradeId: grade?.id,
          gradeName: grade?.name,
        }),
      },
    }));
  },

  selectGrade: (gradeId, grades) => {
    const classesStore = useClassesStore.getState();
    const gradeList = grades || classesStore.classes.flatMap(c => c.grades);
    if (!gradeList || gradeList.length === 0) return;

    const grade = gradeId ? gradeList.find(g => g.id === gradeId) : gradeList.find((g) => g.enrolled < g.capacity);
    if (!grade) return;

    set((state) => ({
      formData: {
        ...state.formData,
        gradeId: grade.id,
        gradeName: grade.name,
        progress: calculateProgress({ ...state.formData, gradeId: grade.id, gradeName: grade.name }),
      },
    }));
  },
}));

/* -------------------------------------------------------------------------- */
/*                             Design Reasoning                               */
/* -------------------------------------------------------------------------- */
/*
- Fully decoupled from direct axios usage.
- All API interactions are centralized through `updateAdmissionClient`.
- Optimistic updates preserve UX while rolling back on failure.
*/

/* -------------------------------------------------------------------------- */
/*                                Structure                                   */
/* -------------------------------------------------------------------------- */
/*
- `completeStep` handles both Step 0 creation and subsequent updates.
- `fetchAdmission` retrieves full admission data and enriches with class/grade names.
- Family and PreviousSchool manipulations use optimistic updates with API sync.
*/

/* -------------------------------------------------------------------------- */
/*                        Implementation Guidance                             */
/* -------------------------------------------------------------------------- */
/*
- `updateAdmissionClient` should be kept up-to-date with API changes.
- Always normalize step data before sending to prevent schema errors.
- Error handling surfaces field-level messages where possible.
*/

/* -------------------------------------------------------------------------- */
/*                           Scalability Insight                              */
/* -------------------------------------------------------------------------- */
/*
- Centralized client helper allows easy switching to different HTTP libraries.
- Store is fully typed and extendable to additional admission steps.
- Optimistic pattern supports offline/fast UI updates safely.
*/
