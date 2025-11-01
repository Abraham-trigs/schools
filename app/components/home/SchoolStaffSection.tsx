"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const staffData = [
  {
    name: "Hon. Clifford Martey Kortey",
    role: "Head of School / Principal",
    category: "Administration",
    image: "/proprietor.webp",
    bio: "Leads the school with vision, discipline, and compassion.",
  },
  {
    name: "Mrs. Ama Ofori",
    role: "Vice Principal / Academic",
    category: "Administration",
    image: "/vice-principal.webp",
    bio: "Oversees curriculum and ensures academic excellence.",
  },
  {
    name: "Mr. Kwame Mensah",
    role: "Vice Principal / Administration",
    category: "Administration",
    image: "/vice-principal-admin.webp",
    bio: "Manages school operations and administration.",
  },
  {
    name: "Ms. Akua Boateng",
    role: "Senior Teacher / Head of Department",
    category: "Teaching",
    image: "/senior-teacher.webp",
    bio: "Leads academic departments and mentors teachers.",
  },
  {
    name: "Mr. Kofi Asante",
    role: "Registrar",
    category: "Support",
    image: "/registrar.webp",
    bio: "Manages student records and enrollment.",
  },
  {
    name: "Mrs. Efua Nyarko",
    role: "Accountant / Finance Manager",
    category: "Support",
    image: "/accountant.webp",
    bio: "Ensures smooth financial operations of the school.",
  },
];

const categories = ["All", "Administration", "Teaching", "Support"];

export default function SchoolStaffSection() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredStaff =
    selectedCategory === "All"
      ? staffData
      : staffData.filter((s) => s.category === selectedCategory);

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--ford-primary)] mb-8">
        Our School Management Team
      </h2>

      {/* Category Filters */}
      <div className="flex justify-center gap-4 mb-12 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              selectedCategory === cat
                ? "bg-[var(--ford-primary)] text-white"
                : "bg-[var(--ford-secondary)] text-[var(--typo)] hover:bg-[var(--ford-primary)] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredStaff.map((staff, idx) => (
          <motion.div
            key={staff.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15, duration: 0.6 }}
            className="relative group bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer "
          >
            {/* Circular Profile Image */}
            <div className="relative w-40 h-40 mx-auto mt-3 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={staff.image}
                alt={staff.name}
                fill
                className="object-cover w-full h-full"
              />
            </div>

            {/* Name & Role */}
            <div className="text-center mt-4 pb-4 px-4">
              <h3 className="font-semibold text-lg text-[var(--ford-primary)]">
                {staff.name}
              </h3>
              <p className="text-sm text-[var(--ford-secondary)]">
                {staff.role}
              </p>
            </div>

            {/* Hover Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/70 text-white flex items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 rounded-2xl"
            >
              <p className="text-sm">{staff.bio}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
