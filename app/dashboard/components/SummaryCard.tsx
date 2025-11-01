"use client";

import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string | LucideIcon;
  subtitle?: string;
  colorClass?: string;
  trend?: number; // positive or negative %
}

export default function SummaryCard({
  title,
  value,
  icon,
  subtitle,
  colorClass,
  trend,
}: SummaryCardProps) {
  const Icon = typeof icon === "string" ? (LucideIcons as any)[icon] : icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative p-4 rounded-lg shadow-lg flex items-center justify-between gap-4 cursor-pointer ${colorClass || "bg-ford-primary"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon + Text */}
      <div className="flex items-center gap-4">
        {Icon && <Icon className="w-8 h-8 text-white" />}
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-white font-bold text-xl">{value}</p>
          {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
        </div>
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className={`text-xs font-semibold ${trend >= 0 ? "text-success" : "text-red-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}

      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white text-black text-sm px-3 py-1 rounded shadow-lg whitespace-nowrap z-50">
          Total: {value}
          {trend !== undefined && <> ({trend >= 0 ? "+" : "-"}{Math.abs(trend)}%)</>}
        </div>
      )}
    </motion.div>
  );
}
