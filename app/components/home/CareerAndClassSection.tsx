"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const images = [
  "/career1.webp",
  "/career2.webp",
  "/career3.webp",
  "/career4.webp",
  "/career5.webp",
  "/career6.webp",
  "/career7.webp",
  "/career8.webp",
];

export default function CareerAndClassSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex flex-col md:flex-row items-stretch justify-center mx-auto max-w-6xl gap-6 md:gap-10 py-16 px-6 text-[var(--typo)]">
      {/* --- Left: Career Day Image + Description --- */}
      <div className="flex flex-col md:w-1/2 bg-[var(--surface)] rounded-2xl shadow-md overflow-hidden">
        <div className="relative w-full h-[250px] md:h-[320px]">
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={src}
                alt={`Career Day ${i + 1}`}
                fill
                className="object-cover object-top" // <-- align to top
              />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col justify-center p-6 md:p-8 bg-[var(--ford-secondary)]">
          <h2 className="text-xl md:text-2xl font-bold mb-3 text-[#e6bb00]">
            Career Day at FORD School Limited
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-[var(--typo-secondary)]">
            At FORD School Limited, Career Day is more than an event — it’s an
            experience that bridges learning and real life. Students engage
            directly with professionals from diverse industries, exploring how
            their studies connect to future careers. Through live demonstrations
            and mentorship, learners are inspired to think boldly, dream big,
            and shape the future with purpose.
          </p>
        </div>
      </div>

      {/* --- Right: Classroom Video --- */}
      <div className="flex flex-col md:w-1/2 bg-[var(--surface)] rounded-2xl shadow-md overflow-hidden">
        <div className="w-full h-[250px] md:h-[320px] bg-black">
          <video
            src="/FORD-CLASS.mp4"
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
        <div className="flex flex-col justify-center p-6 md:p-8 bg-[var(--ford-secondary)]">
          <h2 className="text-xl md:text-2xl font-bold mb-3 text-[#e6bb00]">
            Inside Our Classrooms
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-[var(--typo-secondary)]">
            Our classrooms are more than just spaces — they’re environments
            where learning feels natural, engaging, and comfortable. Students
            interact directly with teachers and peers, exploring concepts
            through hands-on activities and collaborative projects. Through
            curiosity-driven lessons and guided support, learners are inspired
            to think creatively, embrace challenges, and grow with confidence.
          </p>
        </div>
      </div>
    </section>
  );
}
