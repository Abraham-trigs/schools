"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const traitsData = [
  {
    name: "Leader",
    color: "text-white",
    bg: "bg-[var(--ford-primary)]",
    underlineColor: "bg-[var(--ford-primary)]",
    description: `As a Leader, Hon. Clifford Martey Kortey drives FORD School towards excellence.
He ensures that the school operates efficiently, inspires staff with clear vision, and sets high standards for academic and extracurricular achievements.
His leadership fosters a culture of accountability and innovation, guiding students to become responsible, future-ready citizens.
Parents and the community trust his direction, knowing that their children are in capable hands.`,
  },
  {
    name: "Proprietor",
    color: "text-[var(--typo)]",
    bg: "bg-[var(--ford-secondary)]",
    underlineColor: "bg-[var(--ford-secondary)]",
    description: `As Proprietor, he oversees the school's overall operations and long-term strategy.
He ensures that all facilities, curriculum development, and teacher training meet top-notch standards.
His decisions impact students’ learning environment, enhance staff performance, and maintain the school's reputation among parents and the wider community.`,
  },
  {
    name: "Father",
    color: "text-white",
    bg: "bg-[var(--success)]",
    underlineColor: "bg-[var(--success)]",
    description: `As a Father figure, Hon. Clifford Martey Kortey nurtures students individually, supporting their growth academically, socially, and emotionally.
He mentors teachers, offers guidance to parents, and creates a caring environment that values each child.
His presence instills a sense of safety, trust, and personal attention for every student at FORD School.`,
  },
  {
    name: "Friendly",
    color: "text-white",
    bg: "bg-[var(--info)]",
    underlineColor: "bg-[var(--info)]",
    description: `Known for his Friendly nature, he is approachable to students, staff, and parents alike.
He maintains open communication channels with the community and encourages collaboration across all stakeholders.
His warmth and empathy strengthen relationships and make the school feel like a welcoming, inclusive family for everyone.`,
  },
];

export default function ProprietorSection() {
  const [activeTrait, setActiveTrait] = useState(traitsData[0]);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const index = traitsData.findIndex((t) => t.name === activeTrait.name);
    const btn = buttonsRef.current[index];
    if (btn && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setUnderlineStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTrait]);

  return (
    <section className="relative w-screen bg-[var(--ford-secondary)] py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center gap-12 text-[var(--typo)]">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full md:w-1/2 flex justify-center"
        >
          <div className="relative w-[320px] h-[400px] md:w-[380px] md:h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-[var(--ford-secondary)] hover:scale-105 transition-transform duration-500">
            <Image
              src="/proprietor.webp"
              alt="Hon. Clifford Martey Kortey - Proprietor"
              width={1920}
              height={1444}
              priority
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 ring-1 ring-[var(--ford-primary)] rounded-3xl pointer-events-none"></div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start gap-4"
        >
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="text-3xl md:text-4xl font-bold text-[var(--typo)]"
          >
            Hon. Clifford Martey Kortey
          </motion.h2>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { delay: 0.2, duration: 0.6 },
              },
            }}
            className="text-[var(--ford-secondary)] mb-4 font-medium text-sm md:text-base"
          >
            Proprietor & Visionary Leader, FORD School Limited
          </motion.p>

          {/* Traits */}
          <div
            ref={containerRef}
            className="relative flex flex-wrap justify-center md:justify-start gap-2 mb-6"
          >
            {traitsData.map((trait, idx) => (
              <button
                key={trait.name}
                ref={(el) => (buttonsRef.current[idx] = el)}
                onClick={() => setActiveTrait(trait)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors duration-300 ${trait.bg} ${trait.color} hover:brightness-90`}
              >
                {trait.name}
              </button>
            ))}

            <motion.div
              animate={{
                left: underlineStyle.left,
                width: underlineStyle.width,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`absolute bottom-0 h-1 rounded-full ${activeTrait.underlineColor}`}
            />
          </div>

          {/* Description */}
          <div className="text-sm md:text-base leading-relaxed max-w-lg text-[var(--typo-secondary)] flex flex-col gap-2">
            {activeTrait.description.split("\n").map((line, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * idx, duration: 0.5 }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
