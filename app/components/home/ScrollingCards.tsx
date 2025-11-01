"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
  X,
} from "lucide-react";

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const features: Feature[] = [
  {
    id: 1,
    title: "Student Management",
    description: "Track enrollment, attendance, and academic performance.",
    icon: Users,
  },
  {
    id: 2,
    title: "Class Scheduling",
    description: "Automate timetable generation and conflict resolution.",
    icon: Calendar,
  },
  {
    id: 3,
    title: "Grade Reports",
    description: "Generate progress and report cards instantly.",
    icon: ClipboardList,
  },
  {
    id: 4,
    title: "Library System",
    description: "Manage books, lending, and digital resources.",
    icon: Book,
  },
  {
    id: 5,
    title: "Analytics",
    description: "Visualize trends in performance and attendance.",
    icon: BarChart3,
  },
];

export default function FeatureCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<Feature | null>(null);

  // Duplicate the feature list to create a seamless loop
  const doubledFeatures = [...features, ...features];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrame: number;
    const scrollSpeed = 0.8; // slightly slower for smoothness

    // Start slightly offset for seamless look
    scrollContainer.scrollLeft =
      scrollContainer.scrollWidth / 2 - scrollContainer.clientWidth / 2;

    const animate = () => {
      if (!paused) {
        scrollContainer.scrollLeft += scrollSpeed;

        // Reset when reaching half the scroll content
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft -= scrollContainer.scrollWidth / 2;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [paused]);

  return (
    <section className="relative overflow-hidden py-12">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-6 md:px-12 select-none"
      >
        {doubledFeatures.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelected(f);
                setPaused(true);
              }}
              className="flex-shrink-0 w-[80%] sm:w-[45%] md:w-[30%] lg:w-[22%] p-6 bg-[#30000a] hover:bg-[#720019] rounded-2xl shadow-md cursor-pointer transition-all text-[var(--typo)]"
            >
              <div className="flex h-8 w-auto flex-row items-center 3-center gap-3 ">
                <Icon className="w-12 h-12 mb-4 text-[var(--warning)]" />
                <h3 className="text-l font-semibold mb-2">{f.title}</h3>
                {/* <p className="text-sm text-[var(--background)]"></p> */}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Popup inside parent */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative bg-[var(--warning)] text-[var(--typo)] rounded-xl shadow-lg p-8 w-[90%] max-w-md text-center"
            >
              <button
                onClick={() => {
                  setSelected(null);
                  setPaused(false);
                }}
                className="absolute top-3 right-3 text-[var(--warning)] hover:text-[var(--success)] transition"
              >
                <X className="w-6 h-6 text-black hover:text-amber-700 hover:bg-amber-200 hover:rounded-sm" />
              </button>

              <selected.icon className="w-14 h-14 mx-auto mb-4 text-[var(--ford-secondary)]" />
              <h2 className="text-black text-2xl font-bold mb-3">
                {selected.title}
              </h2>
              <p className="text-sm text-black">{selected.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hide scrollbar completely */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
