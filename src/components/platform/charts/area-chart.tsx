"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/types/platform";

interface PlatformAreaChartProps {
  data: ChartPoint[];
  color?: string;
  height?: number;
}

export function PlatformAreaChart({
  data,
  color = "#6d35f2",
  height = 240,
}: PlatformAreaChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#areaFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
