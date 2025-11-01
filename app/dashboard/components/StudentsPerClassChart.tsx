"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface StudentsPerClassChartProps {
  data: { className: string; count: number }[];
}

export default function StudentsPerClassChart({
  data,
}: StudentsPerClassChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="className" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#facc15" />
      </BarChart>
    </ResponsiveContainer>
  );
}
