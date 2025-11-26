// app/store/useBorrowingStore.ts
"use client";
import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient";
import { SchoolAccount } from "@/lib/schoolAccount";

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
  fetchBorrowing: (options?: { page?: number; search?: string }) => Promise<void>;
  fetchBorrowingDebounced: (options?: { page?: number; search?: string }) => void;
  createBorrowing: (payload: { studentId: string; bookId: string; dueDate: string }) => Promise<Borrowing | null>;
  updateBorrowing: (id: string, payload: Partial<Borrowing>) => Promise<Borrowing | null>;
  deleteBorrowing: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  totalPages: () => number;
}

export const useBorrowingStore = create<BorrowingState>((set, get) => {
  const debouncedFetch = debounce((opts?: { page?: number; search?: string }) => get().fetchBorrowing(opts), 300);

  return {
    borrowList: [],
    selectedBorrowing: null,
    page: 1,
    perPage: 10,
    total: 0,
    search: "",
    loading: false,
    error: null,
    cache: {},

    fetchBorrowing: async ({ page = get().page, search = get().search } = {}) => {
      const schoolAccount = await SchoolAccount.init();
      if (!schoolAccount) return set({ error: "Unauthorized" });

      const cached = get().cache[page];
      if (cached && !search) {
        set({ borrowList: cached, page });
        return;
      }

      set({ loading: true, error: null });
      try {
        const params = new URLSearchParams({
          page: String(page),
          perPage: String(get().perPage),
          schoolId: schoolAccount.schoolId,
        });
        if (search) params.append("search", search);

        const data = await apiClient<{ borrowList: Borrowing[]; total: number; page: number }>(
          `/api/library/borrowing?${params.toString()}`
        );

        set((state) => ({
          borrowList: data.borrowList,
          total: data.total,
          page: data.page,
          cache: search === "" ? { ...state.cache, [data.page]: data.borrowList } : state.cache,
        }));
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch borrowings" });
      } finally {
        set({ loading: false });
      }
    },

    fetchBorrowingDebounced: debouncedFetch,

    createBorrowing: async (payload) => {
      set({ loading: true, error: null });
      try {
        const borrowing = await apiClient<Borrowing>("/api/library/borrowing", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        set((state) => ({
          borrowList: [borrowing, ...state.borrowList],
          total: state.total + 1,
          cache: {}, // clear cache to avoid stale pages
        }));
        return borrowing;
      } catch (err: any) {
        set({ error: err?.message || "Failed to create borrowing" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    updateBorrowing: async (id, payload) => {
      set({ loading: true, error: null });
      try {
        const updated = await apiClient<Borrowing>(`/api/library/borrowing/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        set((state) => ({
          borrowList: state.borrowList.map((b) => (b.id === id ? updated : b)),
          selectedBorrowing: state.selectedBorrowing?.id === id ? updated : state.selectedBorrowing,
          cache: {}, // reset cache to avoid stale pages
        }));

        return updated;
      } catch (err: any) {
        set({ error: err?.message || "Failed to update borrowing" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    deleteBorrowing: async (id) => {
      set({ loading: true, error: null });
      try {
        const res = await apiClient<{ success: boolean; error?: any }>(`/api/library/borrowing/${id}`, {
          method: "DELETE",
        });

        if (!res.success) throw new Error(res.error?.message || "Failed to delete borrowing");

        set((state) => ({
          borrowList: state.borrowList.filter((b) => b.id !== id),
          selectedBorrowing: state.selectedBorrowing?.id === id ? null : state.selectedBorrowing,
          total: Math.max(0, state.total - 1),
          cache: {}, // reset cache to avoid stale pages
        }));
      } catch (err: any) {
        set({ error: err?.message || "Failed to delete borrowing" });
      } finally {
        set({ loading: false });
      }
    },

    setPage: (page) => {
      set({ page });
      debouncedFetch({ page, search: get().search });
    },

    setSearch: (search) => {
      set({ search, page: 1 });
      debouncedFetch({ page: 1, search });
    },

    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});
