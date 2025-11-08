// app/store/useClassesStore.ts
// Purpose: Zustand store for managing Classes, Students, Attendance with CRUD, pagination, search (debounced), filters, caching, and notifications.

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { Class, Student } from "@prisma/client";
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { notify } from "@/lib/helpers/notifications";

// ------------------------- Types -------------------------
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
}

interface ClassesStore {
  // ---------------------------
  // State
  // ---------------------------
  classes: Class[];                // list of all classes (paginated)
  total: number;                   // total count for pagination
  page: number;                    // current page
  perPage: number;                 // items per page
  loading: boolean;                // global loading state
  error: string | null;            // global error message

  selectedClass: Class | null;     // currently selected class
  students: Student[];             // flattened students for UI
  attendance: AttendanceRecord[];  // attendance for selected class/date

  search: string;                  // search filter
  sortBy: "name" | "createdAt" | "studentCount"; // sort field
  sortOrder: "asc" | "desc";      // sort direction
  dateFilter?: string;             // optional date filter for attendance

  cache: Record<string, Class[]>;  // simple cache keyed by page/search/sort/date

  // ---------------------------
  // Actions
  // ---------------------------
  fetchClasses: (page?: number, perPage?: number, search?: string) => Promise<void>;
  fetchClassById: (id: string) => Promise<void>;
  fetchAttendance: (classId: string, date?: string) => Promise<void>;

  createClass: (name: string) => Promise<{ success: boolean; data?: Class; error?: string }>;
  updateClass: (id: string, name: string) => Promise<{ success: boolean; data?: Class; error?: string }>;
  deleteClass: (id: string) => Promise<void>;
  markAttendance: (classId: string, records: AttendanceRecord[], date?: string) => Promise<void>;

  selectClass: (cls: Class) => void;
  clearSelectedClass: () => void;

  setSearch: (search: string) => void;
  setSort: (sortBy: "name" | "createdAt" | "studentCount", sortOrder: "asc" | "desc") => void;
  setDateFilter: (date?: string) => void;
}

// ------------------------- Store -------------------------
export const useClassesStore = create<ClassesStore>((set, get) => {
  // Debounced fetch to avoid spamming API on search input
  const debouncedFetch = debounce(() => get().fetchClasses(1), 300);

  return {
    // ---------------------------
    // Initial state
    // ---------------------------
    classes: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: false,
    error: null,
    selectedClass: null,
    students: [],
    attendance: [],
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    dateFilter: undefined,
    cache: {},

    // ---------------------------
    // Fetch paginated classes
    // ---------------------------
    fetchClasses: async (page = get().page, perPage = get().perPage, search = get().search) => {
      set({ loading: true, error: null });
      const { sortBy, sortOrder, dateFilter, cache } = get();
      const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}-${dateFilter}`;

      // Return cached data if available
      if (cache[cacheKey]) {
        set({ classes: cache[cacheKey], loading: false });
        return;
      }

      try {
        const url = `${API_ENDPOINTS.classes}?page=${page}&perPage=${perPage}&search=${encodeURIComponent(
          search
        )}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        const data = await apiClient<{ classes: Class[]; total: number; page: number; perPage: number }>(url, {
          method: "GET",
          showError: true,
        });

        set((state) => ({
          classes: data.classes,
          total: data.total,
          page: data.page,
          perPage: data.perPage,
          cache: { ...state.cache, [cacheKey]: data.classes }, // update cache
          loading: false,
        }));
      } catch (err: any) {
        set({ error: err.message, loading: false });
        notify(err.message, "error");
      }
    },

    // ---------------------------
    // Fetch single class with students
    // ---------------------------
    fetchClassById: async (id) => {
      set({ loading: true, error: null });
      try {
        const data = await apiClient<Class & { students: Student[] }>(`${API_ENDPOINTS.classes}/${id}`);
        set({
          selectedClass: data,
          students: data.students ?? [],
          loading: false,
        });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        notify(err.message, "error");
      }
    },

    // ---------------------------
    // Fetch attendance for a class and optional date
    // ---------------------------
    fetchAttendance: async (classId, date) => {
      set({ loading: true, error: null });
      try {
        const data = await apiClient<AttendanceRecord[]>(
          `${API_ENDPOINTS.classes}/${classId}/attendance?date=${date ?? ""}`,
          { method: "GET" }
        );
        set({ attendance: data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        notify(err.message, "error");
      }
    },

    // ---------------------------
    // Create a new class
    // ---------------------------
    createClass: async (name) => {
      set({ loading: true, error: null });
      try {
        const data = await apiClient<Class>(API_ENDPOINTS.classes, {
          method: "POST",
          body: JSON.stringify({ name }),
          showSuccess: true,
          successMessage: `Class "${name}" created successfully`,
        });

        set((state) => ({
          classes: [data, ...state.classes],
          cache: {}, // invalidate cache
          loading: false,
        }));

        return { success: true, data };
      } catch (err: any) {
        set({ error: err.message, loading: false });
        notify(err.message, "error");
        return { success: false, error: err.message };
      }
    },

    // ---------------------------
    // Update class
    // ---------------------------
    updateClass: async (id, name) => {
      set({ loading: true, error: null });
      try {
        const data = await apiClient<Class>(`${API_ENDPOINTS.classes}/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name }),
          showSuccess: true,
          successMessage: "Class updated successfully",
        });

        set((state) => {
          const updatedClasses = state.classes.map((c) => (c.id === id ? { ...c, ...data } : c));
          const updatedSelected =
            state.selectedClass?.id === id ? { ...state.selectedClass, ...data } : state.selectedClass;
          return { classes: updatedClasses, selectedClass: updatedSelected, loading: false };
        });

        return { success: true, data };
      } catch (err: any) {
        set({ error: err.message, loading: false });
        notify(err.message, "error");
        return { success: false, error: err.message };
      }
    },

    // ---------------------------
    // Delete class
    // ---------------------------
    deleteClass: async (id) => {
  set({ loading: true, error: null });
  try {
    await apiClient(`${API_ENDPOINTS.classes}/${id}`, {
      method: "DELETE",
      showSuccess: true,
      successMessage: "Class deleted successfully",
    });

    set((state) => ({
      classes: state.classes.filter((c) => c.id !== id),
      selectedClass: state.selectedClass?.id === id ? null : state.selectedClass,
      cache: {}, // invalidate cache
      loading: false,
    }));

    return true; // <-- indicate success
  } catch (err: any) {
    set({ error: err.message, loading: false });
    notify(err.message, "error");
    return false; // <-- indicate failure
  }
},


    // ---------------------------
    // Mark attendance
    // ---------------------------
    markAttendance: async (classId, records, date) => {
      set({ loading: true, error: null });
      try {
        await apiClient(`${API_ENDPOINTS.classes}/${classId}/attendance`, {
          method: "POST",
          body: JSON.stringify({ date, records }),
          showSuccess: true,
          successMessage: "Attendance recorded successfully",
        });

        // Refresh attendance after marking
        await get().fetchAttendance(classId, date);
        set({ loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        notify(err.message, "error");
      }
    },

    // ---------------------------
    // Selection helpers
    // ---------------------------
    selectClass: (cls) => set({ selectedClass: { ...cls } }),
    clearSelectedClass: () => set({ selectedClass: null, students: [], attendance: [] }),

    // ---------------------------
    // Filters & sorting
    // ---------------------------
    setSearch: (search) => {
      set({ search, page: 1 });
      debouncedFetch(); // debounced to reduce API calls
    },
    setSort: (sortBy, sortOrder) => {
      set({ sortBy, sortOrder });
      get().fetchClasses(get().page); // immediate fetch on sort change
    },
    setDateFilter: (date) => {
      set({ dateFilter: date });
      get().fetchClasses(1); // refresh with date filter
    },
  };
});
