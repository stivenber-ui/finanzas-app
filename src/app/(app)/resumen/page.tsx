import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

function startOfMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function addMonths(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function endOfMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0);
  return `${y}-${String(m).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

function monthTitle(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function firstDayOfWeek(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfMonth(new Date());
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month + "-01" : today;
  const prevMonth = addMonths(month, -1).slice(0, 7);
  const nextMonth = addMonths(month, 1).slice(0, 7);
  const isCurrentMonth = month === today;
  const end = endOfMonth(month);

  const supabase = await createClient();

  const [{ data: txs }, { data: prevTotals }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, occurred_on, notes, categories(name)")
      .gte("occurred_on", month)
      .lte("occurred_on", end)
      .order("occurred_on"),
    supabase
      .from("monthly_category_totals")
      .select("type, total_amount")
      .eq("period_month", addMonths(month, -1))
      .in("type", ["ingreso", "gasto"]),
  ]);

  const income = (txs ?? []).filter((t) => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
  const expense = (txs ?? []).filter((t) => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : null;

  const prevIncome = (prevTotals ?? []).filter((t) => t.type === "ingreso").reduce((s, t) => s + Number(t.total_amount), 0);
  const prevExpense = (prevTotals ?? []).filter((t) => t.type === "gasto").reduce((s, t) => s + Number(t.total_amount), 0);

  // Category breakdown for expenses
  const catMap = new Map<string, number>();
  for (const tx of txs ?? []) {
    if (tx.type !== "gasto") continue;
    const cats = tx.categories as { name: string } | { name: string }[] | null;
    const name = Array.isArray(cats) ? (cats[0]?.name ?? "Sin categoría") : (cats?.name ?? "Sin categoría");
    catMap.set(name, (catMap.get(name) ?? 0) + Number(tx.amount));
  }
  const catBreakdown = [...catMap.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
  const catMax = catBreakdown[0]?.total ?? 1;

  // Heatmap: sum expenses per day
  const dayExpense = new Map<number, number>();
  for (const tx of txs ?? []) {
    if (tx.type !== "gasto") continue;
    const day = Number(tx.occurred_on.split("-")[2]);
    dayExpense.set(day, (dayExpense.get(day) ?? 0) + Number(tx.amount));
  }
  const maxDay = Math.max(...Array.from(dayExpense.values()), 1);
  const totalDays = daysInMonth(month);
  const startWeekday = firstDayOfWeek(month);
  const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  const HEAT_SCALE = [
    "color-mix(in oklab, var(--negative) 18%, var(--muted))",
    "color-mix(in oklab, var(--negative) 42%, var(--muted))",
    "color-mix(in oklab, var(--negative) 70%, var(--muted))",
    "var(--negative)",
  ];

  function heatLevel(amount: number): number | null {
    if (!amount) return null;
    const intensity = amount / maxDay;
    if (intensity > 0.75) return 3;
    if (intensity > 0.5) return 2;
    if (intensity > 0.25) return 1;
    return 0;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Resumen mensual</p>
          <h1 className="text-2xl font-semibold tracking-tight">{monthTitle(month)}</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <Link
            href={`/resumen?month=${prevMonth}`}
            aria-label="Mes anterior"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground active:bg-background"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <Link
            href={isCurrentMonth ? "/resumen" : `/resumen?month=${nextMonth}`}
            aria-label="Mes siguiente"
            aria-disabled={isCurrentMonth}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-background hover:text-foreground active:bg-background",
              isCurrentMonth ? "pointer-events-none text-muted-foreground/40" : "text-muted-foreground",
            )}
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Ingresos</span>
            <span className="text-lg font-semibold text-positive">{currency.format(income)}</span>
            {prevIncome > 0 && (
              <span className={cn("text-xs", income >= prevIncome ? "text-positive" : "text-negative")}>
                {income >= prevIncome ? "+" : ""}{Math.round(((income - prevIncome) / prevIncome) * 100)}% vs mes anterior
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Gastos</span>
            <span className="text-lg font-semibold">{currency.format(expense)}</span>
            {prevExpense > 0 && (
              <span className={cn("text-xs", expense <= prevExpense ? "text-positive" : "text-negative")}>
                {expense >= prevExpense ? "+" : ""}{Math.round(((expense - prevExpense) / prevExpense) * 100)}% vs mes anterior
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{balance >= 0 ? "Ahorro del mes" : "Déficit del mes"}</p>
            <p className={cn("text-xl font-semibold", balance >= 0 ? "text-positive" : "text-negative")}>
              {currency.format(Math.abs(balance))}
            </p>
          </div>
          {savingsRate !== null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tasa de ahorro</p>
              <p className={cn("text-2xl font-semibold", savingsRate >= 20 ? "text-success" : savingsRate >= 10 ? "text-warning" : "text-negative")}>
                {savingsRate}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapa de gastos diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_LABELS.map((d) => (
              <span key={d} className="text-[10px] font-medium text-muted-foreground">{d}</span>
            ))}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const amount = dayExpense.get(day) ?? 0;
              const level = heatLevel(amount);
              return (
                <div
                  key={day}
                  className="relative flex aspect-square items-center justify-center rounded-md text-[11px] font-medium"
                  style={{ backgroundColor: level === null ? "var(--muted)" : HEAT_SCALE[level] }}
                  title={amount ? currency.format(amount) : "Sin gastos"}
                >
                  <span className={cn(level === null ? "text-muted-foreground" : level >= 2 ? "text-white" : "text-foreground")}>{day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
            <span>Menos</span>
            {HEAT_SCALE.map((c) => (
              <div key={c} className="size-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span>Más</span>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {catBreakdown.map((cat, i) => (
              <div key={cat.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="truncate font-medium">{cat.name}</span>
                  </div>
                  <span className="ml-2 shrink-0 text-muted-foreground">
                    {currency.format(cat.total)}
                    {expense > 0 && <span className="ml-1 text-xs">({Math.round((cat.total / expense) * 100)}%)</span>}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((cat.total / catMax) * 100)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!txs?.length && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Sin movimientos registrados en este mes.
          </CardContent>
        </Card>
      )}

      <Button render={<Link href={`/movimientos?date_from=${month}&date_to=${end}`} />} variant="outline" size="sm">
        Ver todos los movimientos de este mes
      </Button>
    </div>
  );
}
