"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Logo() {
  return (
    <div className="flex flex-col items-center justify-center text-center select-none relative">
      {/* Perspective wrapper */}
      <div className="perspective-1000 relative flex flex-col items-center justify-center">
        {/* Logo image with Y-axis rotation */}
        <motion.div
          className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 z-0"
          animate={{ rotateY: [0, 360] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Image
            src="/FORD-SCHOOL-LOGO.webp"
            alt="Ford School Limited Logo"
            width={1607}
            height={1607}
            className="object-contain drop-shadow-lg"
            priority
          />
        </motion.div>

        {/* Logo text */}
        <div className="mt-4 flex flex-col items-center justify-center z-10 pointer-events-none leading-tight">
          <span className="block font-black tracking-tight text-[var(--ford-primary)] text-4xl sm:text-5xl md:text-6xl lg:text-8xl">
            FORD
          </span>
          <span className="font-bold text-base sm:text-lg md:text-xl mt-1 text-[var(--neutral-dark)]">
            SCHOOL LIMITED
          </span>
        </div>

        {/* Buttons below the logo */}
        <div className="mt-2 sm:mt-4 md:mt-6 lg:mt-6 flex flex-row gap-4 justify-center items-center">
          <button>
            <Link
              href="/admission"
              className="bg-[var(--ford-secondary)] border border-[var(--ford-secondary)] text-[var(--typo)] hover:bg-[#e6bb00] hover:text-[var(--typo)] px-6 py-3 rounded-lg font-medium transition"
            >
              Enroll Now
            </Link>
          </button>
          <button className="bg-[#ddd46d] hover:bg-[var(--neutral-dark)] text-[var(--typo)] px-6 py-3 rounded-lg font-medium transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
