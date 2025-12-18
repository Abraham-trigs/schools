// app/(library)/books/page.tsx
"use client";

import { useEffect } from "react";
import { useLibraryStore } from "@/app/store/useLibraryStore.ts";
import BookModal from "../components/BookModal.tsx";

export default function BooksPage() {
  const {
    books,
    fetchBooks,
    page,
    setPage,
    totalPages,
    loading,
    search,
    setSearch,
    selectedBook,
    setSelectedBook,
  } = useLibraryStore();

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div className="p-4 space-y-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search books..."
        className="border p-2 rounded w-full"
      />

      <button
        type="button"
        onClick={() => setSelectedBook(null)}
        className="border px-3 py-1 rounded"
      >
        + Add Book
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {books.map((b) => (
          <div key={b.id} className="p-3 border rounded">
            <h3 className="font-medium">{b.title}</h3>
            <p className="text-sm">ISBN: {b.isbn}</p>
            <p className="text-sm">Author: {b.author.name}</p>

            <button
              type="button"
              onClick={() => setSelectedBook(b)}
              className="mt-2 text-sm underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {selectedBook !== undefined && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      <div className="flex justify-between items-center">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span>
          {page} / {totalPages()}
        </span>

        <button
          disabled={page >= totalPages()}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {loading && <p>Loading…</p>}
    </div>
  );
}
