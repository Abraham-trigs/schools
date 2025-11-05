// app/(library)/books/BookModal.tsx
"use client";
import { useState, useEffect } from "react";
import { useLibraryStore } from "@/app/store/useLibraryStore";

interface Props {
  book: any;
  onClose: () => void;
}
export default function BookModal({ book, onClose }: Props) {
  const { createBook, updateBook, deleteBook } = useLibraryStore();
  const [form, setForm] = useState({
    title: "",
    isbn: "",
    authorId: "",
    categoryId: "",
    totalCopies: 1,
  });

  useEffect(() => {
    if (book) setForm({ ...book });
  }, [book]);

  const handleSubmit = async () => {
    if (book?.id) await updateBook(book.id, form);
    else await createBook(form);
    onClose();
  };

  const handleDelete = async () => {
    if (book?.id) {
      await deleteBook(book.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96">
        <h2>{book?.id ? "Edit Book" : "Add Book"}</h2>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title"
          className="border p-1 w-full mb-2"
        />
        <input
          value={form.isbn}
          onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
          placeholder="ISBN"
          className="border p-1 w-full mb-2"
        />
        <input
          value={form.authorId}
          onChange={(e) => setForm((f) => ({ ...f, authorId: e.target.value }))}
          placeholder="Author ID"
          className="border p-1 w-full mb-2"
        />
        <input
          value={form.categoryId || ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, categoryId: e.target.value }))
          }
          placeholder="Category ID"
          className="border p-1 w-full mb-2"
        />
        <input
          type="number"
          value={form.totalCopies}
          onChange={(e) =>
            setForm((f) => ({ ...f, totalCopies: Number(e.target.value) }))
          }
          placeholder="Total Copies"
          className="border p-1 w-full mb-2"
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-1 rounded"
          >
            {book?.id ? "Update" : "Create"}
          </button>
          {book?.id && (
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-1 rounded"
            >
              Delete
            </button>
          )}
          <button onClick={onClose} className="bg-gray-300 px-4 py-1 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
