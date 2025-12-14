"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AttendanceTrendChartProps {
  data: { date: string; attendance: number }[];
}

export default function AttendanceTrendChart({
  data,
}: AttendanceTrendChartProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#dd0000"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
