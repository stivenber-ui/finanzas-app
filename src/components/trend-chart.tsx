"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type MonthEntry = { month: string; label: string; income: number; expense: number };
type CatMonthEntry = { label: string; [cat: string]: string | number };

const fullCurrency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function compactCOP(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

const CAT_COLORS = ["#f43f5e", "#fb923c", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#2dd4bf", "#fb7185", "#fbbf24", "#4ade80", "#818cf8"];

function TrendTooltip({ active, payload, label, isDark }: { active?: boolean; payload?: { value: number; name: string; color?: string }[]; label?: string; isDark: boolean }) {
  if (!active || !payload?.length) return null;
  const bg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
      <p style={{ fontWeight: 600, marginBottom: 4, textTransform: "capitalize", color: isDark ? "#f9fafb" : "#111827" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? (p.name === "income" ? "#10b981" : "#f43f5e") }}>
          {p.name === "income" ? "Ingresos" : p.name === "expense" ? "Gastos" : p.name}: {fullCurrency.format(p.value)}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  categoryData = [],
  topCategories = [],
}: {
  data: MonthEntry[];
  categoryData?: CatMonthEntry[];
  topCategories?: string[];
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"trend" | "cats">("trend");

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const cursorColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const hasCategories = categoryData.length > 0 && topCategories.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasCategories && (
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("trend")}
            className={`flex-1 rounded-md py-1 transition-colors ${view === "trend" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Ingresos vs Gastos
          </button>
          <button
            type="button"
            onClick={() => setView("cats")}
            className={`flex-1 rounded-md py-1 transition-colors ${view === "cats" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Por categoría
          </button>
        </div>
      )}

      {view === "trend" ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={compactCOP} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<TrendTooltip isDark={isDark} />} cursor={{ fill: cursorColor }} />
            <Legend formatter={(value) => <span style={{ fontSize: 11, color: textColor }}>{value === "income" ? "Ingresos" : "Gastos"}</span>} />
            <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={categoryData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={compactCOP} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<TrendTooltip isDark={isDark} />} cursor={{ fill: cursorColor }} />
            <Legend formatter={(value) => <span style={{ fontSize: 11, color: textColor }}>{value}</span>} />
            {topCategories.map((cat, i) => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[i % CAT_COLORS.length]} radius={i === topCategories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
