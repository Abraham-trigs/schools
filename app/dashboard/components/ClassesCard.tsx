"use client";
import SummaryCard from "./SummaryCard";

interface ClassesCardProps {
  value: number;
  trend?: number;
}

export default function ClassesCard({ value, trend }: ClassesCardProps) {
  return (
    <SummaryCard
      title="Classes"
      value={value}
      icon="BookOpen"
      colorClass="bg-success"
      trend={trend}
    />
  );
}
