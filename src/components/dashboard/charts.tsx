"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { STATUS_COLORS, PRIORITY_COLORS, CATEGORY_PALETTE } from "@/lib/chart-colors";
import { STATUS_META, PRIORITY_META } from "@/lib/ticket-meta";
import type { TicketPriority, TicketStatus } from "@prisma/client";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

export function StatusDonut({ data }: { data: { status: TicketStatus; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={STATUS_COLORS[d.status]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, _name, item) => [Number(value), STATUS_META[item.payload.status as TicketStatus].label]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PriorityBar({ data }: { data: { priority: TicketPriority; count: number }[] }) {
  const chartData = data.map((d) => ({ ...d, label: PRIORITY_META[d.priority].label }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {chartData.map((d) => (
            <Cell key={d.priority} fill={PRIORITY_COLORS[d.priority]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBar({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CreatedVsResolvedChart({ data }: { data: { label: string; created: number; resolved: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20 }}>
        <defs>
          <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={1} />
        <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="created" name="Created" stroke="#06b6d4" fill="url(#createdGradient)" strokeWidth={2} />
        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#resolvedGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComplianceTrendChart({ data }: { data: { label: string; compliance: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "SLA Compliance"]} />
        <Line type="monotone" dataKey="compliance" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ left: -20 }}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="count" name="Tickets" stroke="#06b6d4" fill="url(#volumeGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
