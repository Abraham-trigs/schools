"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, BarProps } from "recharts";

interface DataItem {
  className: string;
  count: number;
  id?: string; // make optional
}

interface StudentsPerClassChartProps {
  data: DataItem[];
  onBarClick?: (cls: DataItem) => void;
}

export default function StudentsPerClassChart({ data, onBarClick }: StudentsPerClassChartProps) {
  return (
    <div className="w-full h-64 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Students Per Class</h2>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          onClick={(e) => {
            if (e && e.activePayload?.[0]?.payload) {
              onBarClick?.(e.activePayload[0].payload as DataItem);
            }
          }}
        >
          <XAxis dataKey="className" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="count"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            cursor={onBarClick ? "pointer" : "default"} // pointer if clickable
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
