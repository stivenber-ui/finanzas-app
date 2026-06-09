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

const CAT_COLORS = [
  "#f43f5e", "#fb923c", "#facc15", "#34d399", "#60a5fa",
  "#a78bfa", "#f472b6", "#2dd4bf", "#fb7185", "#fbbf24",
  "#4ade80", "#818cf8",
];

function TrendTooltip({ active, payload, label, isDark }: {
  active?: boolean;
  payload?: { value: number; name: string; color?: string }[];
  label?: string;
  isDark: boolean;
}) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => p.value > 0);
  if (!nonZero.length) return null;
  const bg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", maxWidth: 220 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: textPrimary, textTransform: "capitalize" }}>{label}</p>
      {nonZero.map((p) => (
        <p key={p.name} style={{ color: p.color ?? (p.name === "income" ? "#10b981" : "#f43f5e"), lineHeight: 1.6 }}>
          {p.name === "income" ? "Ingresos" : p.name === "expense" ? "Gastos" : p.name}: {fullCurrency.format(p.value)}
        </p>
      ))}
    </div>
  );
}

function CategoryRanking({ categoryData, topCategories }: {
  categoryData: CatMonthEntry[];
  topCategories: string[];
}) {
  const totals = topCategories
    .map((cat, i) => ({
      name: cat,
      total: categoryData.reduce((sum, m) => sum + Number(m[cat] ?? 0), 0),
      color: CAT_COLORS[i % CAT_COLORS.length],
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const max = totals[0]?.total ?? 1;
  const grandTotal = totals.reduce((s, c) => s + c.total, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Total 6 meses · {fullCurrency.format(grandTotal)}
      </p>
      {totals.map((cat) => (
        <div key={cat.name} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="truncate font-medium">{cat.name}</span>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span>{grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0}%</span>
              <span className="font-medium tabular-nums">{fullCurrency.format(cat.total)}</span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.round((cat.total / max) * 100)}%`, backgroundColor: cat.color }}
            />
          </div>
        </div>
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
        <CategoryRanking categoryData={categoryData} topCategories={topCategories} />
      )}
    </div>
  );
}
