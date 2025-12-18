// app/store/useLibraryStore.ts
// Zustand store for Library module: books, borrowings, and library staff

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient.ts";

export interface Author { id: string; name: string; bio?: string }
export interface Category { id: string; name: string }
export interface Book {
  id: string;
  title: string;
  isbn: string;
  author: Author;
  category?: Category | null;
  totalCopies: number;
  available: number;
  createdAt: string;
  updatedAt: string;
}

interface LibraryState {
  books: Book[];
  selectedBook: Book | null;
  page: number;
  perPage: number;
  total: number;
  search: string;
  loading: boolean;
  error: string | null;
  cache: Record<number, Book[]>;

  setSelectedBook: (book: Book | null) => void;
  setPage: (p: number) => void;
  setPerPage: (p: number) => void;
  setSearch: (s: string) => void;
  fetchBooks: (page?: number, search?: string) => Promise<void>;
  fetchBooksDebounced: (page?: number, search?: string) => void;
  fetchBookById: (id: string) => Promise<Book | null>;
  createBook: (payload: Partial<Book>) => Promise<Book | null>;
  updateBook: (id: string, payload: Partial<Book>) => Promise<Book | null>;
  deleteBook: (id: string, onDeleted?: () => void) => Promise<void>;
  totalPages: () => number;
}

export const useLibraryStore = create<LibraryState>((set, get) => {
  const fetchBooksDebounced = debounce(
    (page?: number, search?: string) => get().fetchBooks(page, search),
    300
  );

  return {
    books: [],
    selectedBook: null,
    page: 1,
    perPage: 10,
    total: 0,
    search: "",
    loading: false,
    error: null,
    cache: {},

    // --- Setters
    setSelectedBook: (book) => set({ selectedBook: book }),
    setPage: (page) => set({ page }),
    setPerPage: (perPage) => set({ perPage }),
    setSearch: (search) => { set({ search, page: 1 }); fetchBooksDebounced(1, search); },

    // --- Fetch paginated books
    fetchBooks: async (page = get().page, search = get().search) => {
      const cached = get().cache[page];
      if (cached && !search) { set({ books: cached, page }); return; }

      set({ loading: true, error: null });
      try {
        const data = await apiClient<{ books: Book[]; total: number; page: number }>(
          `/api/library?search=${encodeURIComponent(search)}&page=${page}&perPage=${get().perPage}`
        );
        set((state) => ({
          books: data.books,
          total: data.total,
          page: data.page,
          cache: search === "" ? { ...state.cache, [page]: data.books } : state.cache,
        }));
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch books" });
      } finally {
        set({ loading: false });
      }
    },

    fetchBooksDebounced,

    // --- Fetch individual book
    fetchBookById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const existing = get().books.find((b) => b.id === id);
        if (existing) { set({ selectedBook: existing }); return existing; }

        const fetched = await apiClient<Book>(`/api/library/${id}`);
        set({
          selectedBook: fetched,
          books: [fetched, ...get().books.filter((b) => b.id !== id)]
        });
        return fetched;
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch book" });
        return null;
      } finally { set({ loading: false }); }
    },

    // --- Create book
    createBook: async (payload) => {
      set({ loading: true, error: null });
      try {
        const book = await apiClient<Book>("/api/library", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        set((state) => ({ books: [book, ...state.books], total: state.total + 1 }));
        return book;
      } catch (err: any) {
        set({ error: err?.message || "Failed to create book" });
        return null;
      } finally { set({ loading: false }); }
    },

    // --- Update book
    updateBook: async (id, payload) => {
      set({ loading: true, error: null });
      try {
        const updated = await apiClient<Book>(`/api/library/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        set((state) => {
          const updatedList = state.books.map((b) => (b.id === id ? updated : b));
          const updatedSelected = state.selectedBook?.id === id ? updated : state.selectedBook;
          return {
            books: updatedList,
            selectedBook: updatedSelected || null,
            cache: Object.fromEntries(
              Object.entries(state.cache).map(([k, list]) => [
                k,
                list.map((b) => (b.id === id ? updated : b))
              ])
            ),
          };
        });
        return updated;
      } catch (err: any) {
        set({ error: err?.message || "Failed to update book" });
        return null;
      } finally { set({ loading: false }); }
    },

    // --- Delete book
    deleteBook: async (id, onDeleted) => {
      set({ loading: true, error: null });
      try {
        const res = await apiClient<{ success: boolean; error?: any }>(`/api/library/${id}`, { method: "DELETE" });
        if (res.success) {
          set((state) => ({
            books: state.books.filter((b) => b.id !== id),
            selectedBook: state.selectedBook?.id === id ? null : state.selectedBook,
            total: Math.max(0, state.total - 1),
            cache: Object.fromEntries(Object.entries(state.cache).map(([k, list]) => [k, list.filter((b) => b.id !== id)])),
          }));
          if (onDeleted) onDeleted();
        } else set({ error: res.error?.message || "Failed to delete book" });
      } catch (err: any) {
        set({ error: err?.message || "Failed to delete book" });
      } finally { set({ loading: false }); }
    },

    // --- Total pages calculation
    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});
