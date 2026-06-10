"use client";

import { useState } from "react";
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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => p.value > 0);
  if (!nonZero.length) return null;
  return (
    <div className="max-w-55 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-raised">
      <p className="mb-1 font-semibold capitalize">{label}</p>
      {nonZero.map((p) => (
        <p key={p.name} className="leading-relaxed" style={{ color: p.color ?? (p.name === "income" ? "var(--positive)" : "var(--negative)") }}>
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
  const [selectedIdx, setSelectedIdx] = useState(categoryData.length - 1);
  const month = categoryData[selectedIdx];

  const rows = topCategories
    .map((cat, i) => ({
      name: cat,
      total: Number(month?.[cat] ?? 0),
      color: CAT_COLORS[i % CAT_COLORS.length],
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const max = rows[0]?.total ?? 1;
  const grandTotal = rows.reduce((s, c) => s + c.total, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Month selector */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
        {categoryData.map((m, i) => (
          <button
            key={m.label}
            type="button"
            onClick={() => setSelectedIdx(i)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === selectedIdx
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin gastos este mes</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            {month?.label} · total {fullCurrency.format(grandTotal)}
          </p>
          {rows.map((cat) => (
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
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round((cat.total / max) * 100)}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [view, setView] = useState<"trend" | "cats">("trend");

  const hasCategories = categoryData.length > 0 && topCategories.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasCategories && (
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("trend")}
            className={`flex-1 rounded-md py-1.5 transition-colors ${view === "trend" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Ingresos vs Gastos
          </button>
          <button
            type="button"
            onClick={() => setView("cats")}
            className={`flex-1 rounded-md py-1.5 transition-colors ${view === "cats" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Por categoría
          </button>
        </div>
      )}

      {view === "trend" ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={compactCOP} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<TrendTooltip />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }} />
            <Legend formatter={(value) => <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{value === "income" ? "Ingresos" : "Gastos"}</span>} />
            <Bar dataKey="income" fill="var(--positive)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="var(--negative)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <CategoryRanking categoryData={categoryData} topCategories={topCategories} />
      )}
    </div>
  );
}
