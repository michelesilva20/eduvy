"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/types/platform";

export function PlatformBarChart({ data, height = 240 }: { data: ChartPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#706a80" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#706a80" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(124,58,237,0.14)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="value" name="Atual" fill="#6d35f2" radius={[6, 6, 0, 0]} />
          <Bar dataKey="secondary" name="Anterior" fill="#cbb9ff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
