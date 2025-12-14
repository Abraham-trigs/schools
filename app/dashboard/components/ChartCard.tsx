"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 250 }}
      className="p-4 md:p-6 lg:p-8  rounded-lg flex flex-col bg-white/10 backdrop-blur-3xl border border-white/90 shadow-xl supports-[backdrop-filter]:bg-[#00075c]/12 supports-[backdrop-filter]:backdrop-blur-md transition-all duration-300 hover:bg-"
    >
      <h3 className="text-white font-semibold text-lg mb-4">{title}</h3>
      <div className="flex-1 min-h-[300px]">{children}</div>
    </motion.div>
  );
}
