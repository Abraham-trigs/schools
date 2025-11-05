// app/(library)/books/page.tsx
"use client";
import { useEffect } from "react";
import { useLibraryStore } from "@/app/store/useLibraryStore";
import BookModal from "./components/BookModal.tsx";

export default function BooksPage() {
  const {
    books,
    fetchBooks,
    page,
    perPage,
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
  }, []);

  return (
    <div className="p-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search books..."
        className="border p-2 rounded mb-4 w-full"
      />
      <button onClick={() => setSelectedBook({} as any)}>+ Add Book</button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {books.map((b) => (
          <div key={b.id} className="p-2 border rounded">
            <h3>{b.title}</h3>
            <p>ISBN: {b.isbn}</p>
            <p>Author: {b.author.name}</p>
            <button onClick={() => setSelectedBook(b)}>Edit</button>
          </div>
        ))}
      </div>
      <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      <div className="mt-4 flex justify-between">
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
      {loading && <p>Loading...</p>}
    </div>
  );
}
