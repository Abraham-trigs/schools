"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Leaf, Users, BookOpen, Heart, X } from "lucide-react";

const qualities = [
  {
    icon: <Leaf className="w-8 h-8 text-[var(--warning)]" />,
    title: "Sound Environment",
    description:
      "FORD provides a serene and secure learning atmosphere that inspires focus, confidence, and curiosity.",
    image: "/quality1.webp",
  },
  {
    icon: <Users className="w-8 h-8 text-[var(--warning)]" />,
    title: "Expert Teachers",
    description:
      "Our dedicated educators blend deep subject mastery with empathy, ensuring every student feels seen and supported.",
    image: "/quality2.webp",
  },
  {
    icon: <BookOpen className="w-8 h-8 text-[var(--warning)]" />,
    title: "Modern Learning",
    description:
      "Interactive lessons, digital resources, and practical sessions connect classroom concepts to real-world applications.",
    image: "/quality3.webp",
  },
  {
    icon: <Heart className="w-8 h-8 text-[var(--warning)]" />,
    title: "Holistic Growth",
    description:
      "Beyond academics, students develop leadership, creativity, and social values for life beyond school walls.",
    image: "/quality4.webp",
  },
];

export default function QualitiesSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  return (
    <section className="mx-auto max-w-5xl px-6 md:px-10 py-16 text-center text-[var(--typo)]">
      {/* Section Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-[var(--ford-primary)] mb-6">
        Qualities of Education with FORD
      </h2>
      <p className="max-w-2xl mx-auto text-[var(--ford-secondary)] mb-10 text-sm md:text-base">
        At FORD School Limited, education is more than instruction — it’s an
        experience built on values that shape lifelong learners and future
        leaders.
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualities.map((item, index) => (
          <motion.div
            key={index}
            layoutId={`card-${index}`}
            whileHover={{ y: -6, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 250 }}
            className="flex flex-col items-center bg-[var(--ford-secondary)] hover:bg-[var(--success)] ease-in-out rounded-2xl shadow-md p-6 text-center cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
              setSelected(index);
            }}
          >
            <div className="mb-3">{item.icon}</div>
            <h3 className="font-semibold text-lg mb-2 text-[var(--warning)]">
              {item.title}
            </h3>
            <p className="text-sm text-[var(--typo)] leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={`card-${selected}`}
              className="relative bg-[var(--surface)] rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-[90%] cursor-default"
              initial={{
                opacity: 0,
                scale: 0.8,
                x: position ? position.x - window.innerWidth / 2 : 0,
                y: position ? position.y - window.innerHeight / 2 : 0,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                transition: { type: "spring", stiffness: 180, damping: 15 },
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.25 },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="bg-amber-800 rounded-2xl p-2 absolute top-3 right-3 text-[var(--typo-secondary)] hover:text-[var(--typo)]"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image */}
              <div className="w-full h-auto">
                <Image
                  src={qualities[selected].image}
                  alt={qualities[selected].title}
                  width={1920}
                  height={1444}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>

              {/* Caption */}
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2 text-[var(--warning)]">
                  {qualities[selected].title}
                </h3>
                <p className="text-sm md:text-base text-[var(--typo-secondary)]">
                  {qualities[selected].description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
