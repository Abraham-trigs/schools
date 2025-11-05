// app/store/useLibraryStaffStore.ts
// Zustand store for LibraryStaff: CRUD, pagination, search, optimistic updates

"use client";
import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient.ts";

export interface LibraryStaff { id: string; userId: string; user: { id: string; name: string; email: string }; position?: string | null; department?: { id: string; name: string } | null; createdAt: string; updatedAt: string; }

interface LibraryStaffState {
  staffList: LibraryStaff[];
  selectedStaff: LibraryStaff | null;
  page: number;
  perPage: number;
  total: number;
  search: string;
  loading: boolean;
  error: string | null;
  cache: Record<number, LibraryStaff[]>;
  setPage: (p: number) => void;
  setPerPage: (p: number) => void;
  setSearch: (s: string) => void;
  fetchStaff: (page?: number, search?: string) => Promise<void>;
  fetchStaffDebounced: (page?: number, search?: string) => void;
  fetchStaffById: (id: string) => Promise<LibraryStaff | null>;
  createStaff: (payload: Partial<LibraryStaff> & { password: string }) => Promise<LibraryStaff | null>;
  updateStaff: (id: string, payload: Partial<LibraryStaff>) => void;
  deleteStaff: (id: string, onDeleted?: () => void) => Promise<void>;
  totalPages: () => number;
}

export const useLibraryStaffStore = create<LibraryStaffState>((set, get) => {
  const fetchStaffDebounced = debounce((page?: number, search?: string) => get().fetchStaff(page, search), 300);
  return {
    staffList: [], selectedStaff: null, page: 1, perPage: 10, total: 0, search: "", loading: false, error: null, cache: {},
    setPage: (page) => set({ page }), setPerPage: (perPage) => set({ perPage }),
    setSearch: (search) => { set({ search, page: 1 }); fetchStaffDebounced(1, search); },
    fetchStaff: async (page = get().page, search = get().search) => {
      const cached = get().cache[page]; if (cached && !search) { set({ staffList: cached, page }); return; }
      set({ loading: true, error: null });
      try { const data = await apiClient<{ staffList: LibraryStaff[]; total: number; page: number }>(`/api/library/staff?search=${encodeURIComponent(search)}&page=${page}&perPage=${get().perPage}`); set((state) => ({ staffList: data.staffList, total: data.total, page: data.page, cache: search === "" ? { ...state.cache, [page]: data.staffList } : state.cache })); } catch (err: any) { set({ error: err?.message || "Failed to fetch staff" }); } finally { set({ loading: false }); }
    },
    fetchStaffDebounced,
    fetchStaffById: async (id) => { set({ loading: true, error: null }); try { const existing = get().staffList.find((s) => s.id === id); if (existing) { set({ selectedStaff: existing }); return existing; } const fetched = await apiClient<LibraryStaff>(`/api/library/staff/${id}`); set({ selectedStaff: fetched, staffList: [fetched, ...get().staffList.filter((s) => s.id !== id)] }); return fetched; } catch (err: any) { set({ error: err?.message || "Failed" }); return null; } finally { set({ loading: false }); } },
    createStaff: async (payload) => { set({ loading: true, error: null }); try { const staff = await apiClient<LibraryStaff>("/api/library/staff", { method: "POST", body: JSON.stringify(payload) }); set((state) => ({ staffList: [staff, ...state.staffList], total: state.total + 1 })); return staff; } catch (err: any) { set({ error: err?.message || "Failed" }); return null; } finally { set({ loading: false }); } },
    updateStaff: (id, payload) => { set((state) => { const updatedList = state.staffList.map((s) => s.id === id ? { ...s, ...payload } : s); const updatedSelected = state.selectedStaff?.id === id ? { ...state.selectedStaff, ...payload } : state.selectedStaff; return { staffList: updatedList, selectedStaff: updatedSelected || null, cache: Object.fromEntries(Object.entries(state.cache).map(([k, list]) => [k, list.map((s) => s.id === id ? { ...s, ...payload } : s)])) }; }); },
    deleteStaff: async (id, onDeleted) => { set({ loading: true, error: null }); try { const res = await apiClient<{ success: boolean; error?: any }>(`/api/library/staff/${id}`, { method: "DELETE" }); if (res.success) { set((state) => ({ staffList: state.staffList.filter((s) => s.id !== id), selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff, total: Math.max(0, state.total - 1), cache: Object.fromEntries(Object.entries(state.cache).map(([k, list]) => [k, list.filter((s) => s.id !== id)])) })); if (onDeleted) onDeleted(); } else set({ error: res.error?.message || "Failed" }); } catch (err: any) { set({ error: err?.message || "Failed" }); } finally { set({ loading: false }); } },
    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});
