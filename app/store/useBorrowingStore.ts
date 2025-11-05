// app/store/useBorrowingStore.ts
// Zustand store for Library Borrowing: CRUD, pagination, search, optimistic updates

"use client";
import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient";

export interface Borrowing {
  id: string;
  student: { id: string; user: { name: string; email: string } };
  book: { id: string; title: string; quantity: number };
  librarian: { id: string; user: { name: string } };
  dueDate: string;
  returned: boolean;
  returnedAt?: string | null;
}

interface BorrowingState {
  borrowList: Borrowing[];
  selectedBorrowing: Borrowing | null;
  page: number;
  perPage: number;
  total: number;
  search: string;
  loading: boolean;
  error: string | null;
  cache: Record<number, Borrowing[]>;
  setPage: (p: number) => void;
  setPerPage: (p: number) => void;
  setSearch: (s: string) => void;
  fetchBorrowing: (page?: number, search?: string) => Promise<void>;
  fetchBorrowingDebounced: (page?: number, search?: string) => void;
  createBorrowing: (payload: { studentId: string; bookId: string; dueDate: string }) => Promise<Borrowing | null>;
  updateBorrowing: (id: string, payload: Partial<Borrowing>) => void;
  deleteBorrowing: (id: string, onDeleted?: () => void) => Promise<void>;
  totalPages: () => number;
}

export const useBorrowingStore = create<BorrowingState>((set, get) => {
  const fetchBorrowingDebounced = debounce((page?: number, search?: string) => get().fetchBorrowing(page, search), 300);

  return {
    borrowList: [], selectedBorrowing: null, page: 1, perPage: 10, total: 0, search: "", loading: false, error: null, cache: {},
    setPage: (p) => set({ page: p }), setPerPage: (p) => set({ perPage: p }),
    setSearch: (s) => { set({ search: s, page: 1 }); fetchBorrowingDebounced(1, s); },
    fetchBorrowing: async (page = get().page, search = get().search) => {
      const cached = get().cache[page]; if (cached && !search) { set({ borrowList: cached, page }); return; }
      set({ loading: true, error: null });
      try { const data = await apiClient<{ borrowList: Borrowing[]; total: number; page: number }>(`/api/library/borrowing?search=${encodeURIComponent(search)}&page=${page}&perPage=${get().perPage}`); set(state => ({ borrowList: data.borrowList, total: data.total, page: data.page, cache: search === "" ? { ...state.cache, [page]: data.borrowList } : state.cache })); } catch (err: any) { set({ error: err?.message || "Failed" }); } finally { set({ loading: false }); }
    },
    fetchBorrowingDebounced,
    createBorrowing: async (payload) => { set({ loading: true, error: null }); try { const b = await apiClient<Borrowing>("/api/library/borrowing", { method: "POST", body: JSON.stringify(payload) }); set(state => ({ borrowList: [b, ...state.borrowList], total: state.total + 1 })); return b; } catch (err: any) { set({ error: err?.message || "Failed" }); return null; } finally { set({ loading: false }); } },
    updateBorrowing: (id, payload) => set(state => ({ borrowList: state.borrowList.map(b => b.id === id ? { ...b, ...payload } : b), selectedBorrowing: state.selectedBorrowing?.id === id ? { ...state.selectedBorrowing, ...payload } : state.selectedBorrowing || null })),
    deleteBorrowing: async (id, onDeleted) => { set({ loading: true, error: null }); try { const res = await apiClient<{ success: boolean; error?: any }>(`/api/library/borrowing/${id}`, { method: "DELETE" }); if (res.success) { set(state => ({ borrowList: state.borrowList.filter(b => b.id !== id), selectedBorrowing: state.selectedBorrowing?.id === id ? null : state.selectedBorrowing, total: Math.max(0, state.total - 1), cache: Object.fromEntries(Object.entries(state.cache).map(([k, list]) => [k, list.filter(b => b.id !== id)])) })); if (onDeleted) onDeleted(); } else set({ error: res.error?.message || "Failed" }); } catch (err: any) { set({ error: err?.message || "Failed" }); } finally { set({ loading: false }); } },
    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});
