"use client";

import Image from "next/image";

export default function InspiringLeadersSection() {
  return (
    <section className="w-full flex justify-center my-12 px-4 sm:px-6 md:px-8">
      <div className="relative w-full max-w-5xl rounded-2xl shadow-md overflow-hidden">
        {/* Image */}
        <div className="relative w-full h-auto">
          <Image
            src="/oko-boye.webp"
            alt="Students listening to Hon. Okoe Boye"
            width={1920}
            height={1444}
            priority
            className="w-full h-auto object-contain object-center"
          />

          {/* Text Overlay */}
          <div className="absolute top-4 md:top-18 left-0 w-full text-center px-4 md:px-10">
            <h2 className="text-[var(--ford-primary)] text-lg md:text-3xl font-bold drop-shadow-sm">
              Inspiring Future Leaders
            </h2>
            <p className="text-[var(--ford-secondary)]  md:w-2x5 text-xs md:text-sm font-medium max-w-3xl mx-auto leading-relaxed">
              <span className="font-black">Hon. Okoe Boye</span> shared powerful
              insights on leadership, service, and vision with our students —
              motivating them to dream boldly, think critically, and shape the
              future with purpose.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
