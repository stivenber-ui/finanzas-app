import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Target, ChevronRight, RefreshCw, BarChart2, Wallet, TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendChart } from "@/components/trend-chart";
import { CircleProgress } from "@/components/circle-progress";
import { CountUp } from "@/components/count-up";
import { EmptyState } from "@/components/empty-state";

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

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function startOfMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function addMonths(yearMonthDay: string, n: number): string {
  const [y, m] = yearMonthDay.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthLabel(yearMonthDay: string): string {
  const [y, m] = yearMonthDay.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit" }).format(new Date(y, m - 1, 1));
}

function diffMonths(fromYearMonthDay: string, toYearMonthDay: string): number {
  const [fy, fm] = fromYearMonthDay.split("-").map(Number);
  const [ty, tm] = toYearMonthDay.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const periodMonth = startOfMonth(new Date());
  const sixMonthsAgo = addMonths(periodMonth, -5);
  const nextMonthStart = addMonths(periodMonth, 1);

  const [
    { data: balances },
    { data: totals },
    { data: recent },
    { data: catTxs },
    { data: trendRaw },
    { data: goals },
    { data: goalContributions },
    { data: catTrendTxs },
  ] = await Promise.all([
    supabase.from("account_balances").select("current_balance, type"),
    supabase.from("monthly_category_totals").select("type, total_amount").eq("period_month", periodMonth).in("type", ["ingreso", "gasto"]),
    supabase.from("transactions").select("id, type, amount, occurred_on, notes, accounts!transactions_account_id_fkey(name), categories(name)").order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(8),
    supabase.from("transactions").select("amount, categories(name)").eq("type", "gasto").gte("occurred_on", periodMonth).lt("occurred_on", nextMonthStart),
    supabase.from("monthly_category_totals").select("period_month, type, total_amount").in("type", ["ingreso", "gasto"]).gte("period_month", sixMonthsAgo).lte("period_month", periodMonth).order("period_month", { ascending: true }),
    supabase.from("goals").select("id, name, target_amount, initial_amount, target_date").eq("status", "activa"),
    supabase.from("transactions").select("goal_id, amount").not("goal_id", "is", null),
    supabase.from("transactions").select("occurred_on, amount, categories(name)").eq("type", "gasto").gte("occurred_on", sixMonthsAgo).lt("occurred_on", nextMonthStart),
  ]);

  const netWorth = (balances ?? []).reduce((sum, a) => sum + Number(a.current_balance), 0);
  const monthIncome = (totals ?? []).filter((t) => t.type === "ingreso").reduce((sum, t) => sum + Number(t.total_amount), 0);
  const monthExpense = (totals ?? []).filter((t) => t.type === "gasto").reduce((sum, t) => sum + Number(t.total_amount), 0);
  const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : null;

  // Category breakdown
  type CatEntry = { name: string; total: number };
  const catMap = new Map<string, number>();
  for (const tx of catTxs ?? []) {
    const cats = tx.categories as { name: string } | { name: string }[] | null;
    const catName = Array.isArray(cats) ? (cats[0]?.name ?? "Sin categoría") : (cats?.name ?? "Sin categoría");
    catMap.set(catName, (catMap.get(catName) ?? 0) + Number(tx.amount));
  }
  const catBreakdown: CatEntry[] = [...catMap.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6);
  const catMax = catBreakdown[0]?.total ?? 1;

  // Monthly trend (last 6 months)
  type MonthEntry = { month: string; label: string; income: number; expense: number };
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (const row of trendRaw ?? []) {
    const entry = trendMap.get(row.period_month) ?? { income: 0, expense: 0 };
    if (row.type === "ingreso") entry.income += Number(row.total_amount);
    else if (row.type === "gasto") entry.expense += Number(row.total_amount);
    trendMap.set(row.period_month, entry);
  }
  const allMonths: MonthEntry[] = [];
  let cur = sixMonthsAgo;
  while (cur <= periodMonth) {
    const e = trendMap.get(cur) ?? { income: 0, expense: 0 };
    allMonths.push({ month: cur, label: monthLabel(cur), ...e });
    cur = addMonths(cur, 1);
  }

  // Category trend (6 months, for stacked chart)
  const catTrendMap = new Map<string, Map<string, number>>();
  for (const tx of catTrendTxs ?? []) {
    const monthKey = tx.occurred_on.slice(0, 7) + "-01";
    const cats = tx.categories as { name: string } | { name: string }[] | null;
    const catName = Array.isArray(cats) ? (cats[0]?.name ?? "Sin categoría") : (cats?.name ?? "Sin categoría");
    if (!catTrendMap.has(monthKey)) catTrendMap.set(monthKey, new Map());
    const m = catTrendMap.get(monthKey)!;
    m.set(catName, (m.get(catName) ?? 0) + Number(tx.amount));
  }
  const totalByCategory = new Map<string, number>();
  for (const [, m] of catTrendMap) {
    for (const [cat, amt] of m) totalByCategory.set(cat, (totalByCategory.get(cat) ?? 0) + amt);
  }
  const topCategories = [...totalByCategory.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const categoryData: { label: string; [cat: string]: string | number }[] = allMonths.map((m) => {
    const monthMap = catTrendMap.get(m.month) ?? new Map();
    const entry: { label: string; [cat: string]: string | number } = { label: m.label };
    for (const cat of topCategories) entry[cat] = monthMap.get(cat) ?? 0;
    return entry;
  });

  // Goal contributions
  const contributedByGoal = new Map<string, number>();
  for (const t of goalContributions ?? []) {
    if (!t.goal_id) continue;
    contributedByGoal.set(t.goal_id, (contributedByGoal.get(t.goal_id) ?? 0) + Number(t.amount));
  }
  const sortedGoals = [...(goals ?? [])].sort((a, b) => {
    if (!a.target_date && !b.target_date) return 0;
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return a.target_date.localeCompare(b.target_date);
  });

  const firstName = user?.email?.split("@")[0];
  const monthNet = monthIncome - monthExpense;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero: net worth */}
      <div className="flex flex-col px-1 pt-2 pb-1 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <p className="text-sm text-muted-foreground">Hola{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="mt-3 text-sm font-medium text-muted-foreground">Patrimonio neto</h1>
        <p className={cn("mt-0.5 text-4xl font-semibold tracking-tight", netWorth < 0 && "text-negative")}>
          <CountUp value={netWorth} />
        </p>
        {(monthIncome > 0 || monthExpense > 0) && (
          <div className="mt-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                monthNet >= 0 ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative",
              )}
            >
              {monthNet >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {monthNet >= 0 ? "+" : "−"}{currency.format(Math.abs(monthNet))} este mes
            </span>
          </div>
        )}
      </div>

      {/* Cash flow */}
      <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:60ms] [animation-fill-mode:backwards]">
        <CardContent className="flex items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-positive/10 text-positive">
              <ArrowUpRight className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Ingresos del mes</p>
              <p className="truncate text-base font-semibold">{currency.format(monthIncome)}</p>
            </div>
          </div>
          <div className="mx-3 w-px shrink-0 bg-border" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-negative/10 text-negative">
              <ArrowDownRight className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Gastos del mes</p>
              <p className="truncate text-base font-semibold">{currency.format(monthExpense)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {savingsRate !== null && (
        <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:120ms] [animation-fill-mode:backwards]">
          <CardContent className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">Tasa de ahorro</p>
              <p className="text-xs text-muted-foreground">
                {savingsRate >= 20 ? "Excelente ritmo" : savingsRate >= 10 ? "Buen ritmo" : savingsRate >= 0 ? "Margen de mejora" : "Gastos mayores que ingresos"}
              </p>
            </div>
            <div className="relative shrink-0">
              <CircleProgress
                pct={Math.max(0, savingsRate)}
                size={68}
                stroke={6}
                color={savingsRate >= 20 ? "var(--success)" : savingsRate >= 10 ? "var(--warning)" : "var(--negative)"}
              />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{savingsRate}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:180ms] [animation-fill-mode:backwards]">
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoría este mes</CardTitle>
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
                    {currency.format(cat.total)}{" "}
                    <span className="text-xs">({monthExpense > 0 ? Math.round((cat.total / monthExpense) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round((cat.total / catMax) * 100)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trend chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Tendencia 6 meses</CardTitle>
          <Button render={<Link href="/resumen" />} variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            Ver resumen <ChevronRight className="ml-0.5 size-3" />
          </Button>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <TrendChart data={allMonths} categoryData={categoryData} topCategories={topCategories} />
        </CardContent>
      </Card>

      {/* Active goals */}
      {sortedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metas activas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {sortedGoals.map((goal) => {
              const current = Number(goal.initial_amount) + (contributedByGoal.get(goal.id) ?? 0);
              const target = Number(goal.target_amount);
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              const remaining = target - current;

              let tip = "";
              if (remaining <= 0) {
                tip = "¡Meta alcanzada! Puedes marcarla como completada.";
              } else if (goal.target_date) {
                const monthsLeft = diffMonths(periodMonth, goal.target_date.slice(0, 7) + "-01");
                if (monthsLeft < 0) tip = `Te faltan ${currency.format(remaining)}. La fecha objetivo ya pasó.`;
                else if (monthsLeft === 0) tip = `Te faltan ${currency.format(remaining)}. ¡Este es el último mes!`;
                else tip = `Te faltan ${currency.format(remaining)}. Para cumplirla necesitas ahorrar ${currency.format(Math.ceil(remaining / monthsLeft))}/mes.`;
              } else {
                tip = `Te faltan ${currency.format(remaining)} para completar esta meta.`;
              }

              return (
                <div key={goal.id} className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <CircleProgress pct={pct} size={64} stroke={6} color={pct >= 100 ? "var(--success)" : "var(--primary)"} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pct}%</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Target className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{goal.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currency.format(current)} / {currency.format(target)}</span>
                    <p className="text-xs text-muted-foreground">{tip}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/resumen">
          <Card className="transition-all active:scale-[0.97] active:bg-muted/60">
            <CardContent className="flex flex-col items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BarChart2 className="size-4" />
              </div>
              <p className="text-xs font-medium">Resumen</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/presupuesto">
          <Card className="transition-all active:scale-[0.97] active:bg-muted/60">
            <CardContent className="flex flex-col items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="size-4" />
              </div>
              <p className="text-xs font-medium">Presupuesto</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/recurrentes">
          <Card className="transition-all active:scale-[0.97] active:bg-muted/60">
            <CardContent className="flex flex-col items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RefreshCw className="size-4" />
              </div>
              <p className="text-xs font-medium">Recurrentes</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
          {!!recent?.length && (
            <Button render={<Link href="/movimientos" />} variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              Ver todos <ChevronRight className="ml-0.5 size-3" />
            </Button>
          )}
        </CardHeader>
        {!recent?.length ? (
          <CardContent>
            <EmptyState icon={Inbox} title="Aún no hay movimientos" description="Registra el primero con el botón + de abajo." />
          </CardContent>
        ) : (
          <CardContent className="flex flex-col gap-3">
            {recent.map((tx) => (
              <RecentRow key={tx.id} tx={normalizeRecentTx(tx)} />
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

type RecentTx = { id: string; type: "ingreso" | "gasto" | "transferencia"; amount: number; occurred_on: string; notes: string | null; accounts: { name: string } | null; categories: { name: string } | null };
type RawRecentTx = { id: string; type: "ingreso" | "gasto" | "transferencia"; amount: number; occurred_on: string; notes: string | null; accounts: { name: string }[] | { name: string } | null; categories: { name: string }[] | { name: string } | null };

function normalizeRecentTx(tx: RawRecentTx): RecentTx {
  return { ...tx, accounts: Array.isArray(tx.accounts) ? (tx.accounts[0] ?? null) : tx.accounts, categories: Array.isArray(tx.categories) ? (tx.categories[0] ?? null) : tx.categories };
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
function formatDateOnly(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function RecentRow({ tx }: { tx: RecentTx }) {
  const Icon = tx.type === "ingreso" ? ArrowUpRight : tx.type === "gasto" ? ArrowDownRight : ArrowLeftRight;
  const chip = tx.type === "ingreso" ? "bg-positive/10 text-positive" : tx.type === "gasto" ? "bg-negative/10 text-negative" : "bg-muted text-muted-foreground";
  const amountColor = tx.type === "ingreso" ? "text-positive" : tx.type === "gasto" ? "text-foreground" : "text-muted-foreground";
  const sign = tx.type === "ingreso" ? "+" : tx.type === "gasto" ? "−" : "";
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{tx.notes || tx.categories?.name || tx.accounts?.name || "Movimiento"}</span>
        <span className="truncate text-xs text-muted-foreground">{formatDateOnly(tx.occurred_on)} · {tx.accounts?.name}</span>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold", amountColor)}>{sign}{currency.format(tx.amount)}</span>
    </div>
  );
}
