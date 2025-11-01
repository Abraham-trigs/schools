"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryGridProps {
  imageFiles: string[];
}

export default function GalleryGrid({ imageFiles }: GalleryGridProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const showImage = (index: number) => setCurrentIndex(index);
  const closeLightbox = () => setCurrentIndex(null);
  const nextImage = () =>
    setCurrentIndex((prev) =>
      prev !== null ? (prev + 1) % imageFiles.length : null
    );
  const prevImage = () =>
    setCurrentIndex((prev) =>
      prev !== null ? (prev - 1 + imageFiles.length) % imageFiles.length : null
    );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  // Random rotation helper
  const randomRotation = () => Math.floor(Math.random() * 30) - 15;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.7, rotateY: randomRotation(), y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      y: 0,
      transition: { type: "spring", stiffness: 280, damping: 25 },
    },
  };

  return (
    <>
      {/* Gallery Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl w-full px-6 perspective-[1200px]"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {imageFiles.map((file, i) => (
          <motion.div
            key={file}
            variants={cardVariants}
            className="overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all cursor-pointer bg-[var(--ford-card)]"
            onClick={() => showImage(i)}
            whileHover={{ scale: 1.05, rotateY: 8 }}
          >
            <Image
              src={`/${file}`}
              alt={`Gallery image ${i + 1}`}
              width={400}
              height={400}
              className="object-cover w-full h-full select-none"
              loading="lazy"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {currentIndex !== null && (
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative max-w-5xl w-[90%] rounded-2xl overflow-hidden shadow-2xl bg-black/90 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={`/${imageFiles[currentIndex]}`}
                alt={`Gallery image ${currentIndex + 1}`}
                width={1200}
                height={800}
                className="object-contain w-full h-auto select-none"
              />

              {/* Close */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X size={24} />
              </button>

              {/* Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
              >
                <ChevronRight size={26} />
              </button>

              {/* Hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-70">
                Use arrows or keyboard & Esc to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
