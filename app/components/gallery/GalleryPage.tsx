"use client";

import GalleryGrid from "./GalleryGrid.tsx";

export default function GalleryPage() {
  const imageFiles = [
    "gallery 1.webp",
    "gallery 2.webp",
    "gallery 3.webp",
    "gallery 4.webp",
    "gallery 5.webp",
    "gallery 6.webp",
    "gallery 7.webp",
    "gallery 8.webp",
    "gallery 9.webp",
    "gallery 10.webp",
    "gallery 11.webp",
    "gallery 12.webp",
    "gallery 13.webp",
    "gallery 14.webp",
    "gallery 15.webp",
    "gallery 16.webp",
    "gallery 17.webp",
    "gallery 18.webp",
    "gallery 19.webp",
    "gallery 20.webp",
    "gallery 21.webp",
    "gallery 22.webp",
    "gallery 23.webp",
    "gallery 24.webp",
    "gallery 25.webp",
    "gallery 26.webp",
    "gallery 27.webp",
  ];

  return (
    <main className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-start text-[var(--typo)]">
      <h1 className="text-3xl font-bold mb-10 text-[var(--typo)]">
        School Gallery
      </h1>

      {/* ✅ Directly pass the array of filenames */}
      <GalleryGrid imageFiles={imageFiles} />
    </main>
  );
}
