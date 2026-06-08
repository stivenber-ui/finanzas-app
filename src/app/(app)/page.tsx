import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  ] = await Promise.all([
    supabase.from("account_balances").select("current_balance, type"),
    supabase
      .from("monthly_category_totals")
      .select("type, total_amount")
      .eq("period_month", periodMonth)
      .in("type", ["ingreso", "gasto"]),
    supabase
      .from("transactions")
      .select("id, type, amount, occurred_on, notes, accounts!transactions_account_id_fkey(name), categories(name)")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("transactions")
      .select("amount, categories(name)")
      .eq("type", "gasto")
      .gte("occurred_on", periodMonth)
      .lt("occurred_on", nextMonthStart),
    supabase
      .from("monthly_category_totals")
      .select("period_month, type, total_amount")
      .in("type", ["ingreso", "gasto"])
      .gte("period_month", sixMonthsAgo)
      .lte("period_month", periodMonth)
      .order("period_month", { ascending: true }),
    supabase
      .from("goals")
      .select("id, name, target_amount, initial_amount, target_date")
      .eq("status", "activa"),
    supabase.from("transactions").select("goal_id, amount").not("goal_id", "is", null),
  ]);

  const netWorth = (balances ?? []).reduce((sum, a) => sum + Number(a.current_balance), 0);
  const monthIncome = (totals ?? [])
    .filter((t) => t.type === "ingreso")
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  const monthExpense = (totals ?? [])
    .filter((t) => t.type === "gasto")
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  // Category breakdown
  type CatEntry = { name: string; total: number };
  const catMap = new Map<string, number>();
  for (const tx of catTxs ?? []) {
    const cats = tx.categories as { name: string } | { name: string }[] | null;
    const catName = Array.isArray(cats) ? (cats[0]?.name ?? "Sin categoría") : (cats?.name ?? "Sin categoría");
    catMap.set(catName, (catMap.get(catName) ?? 0) + Number(tx.amount));
  }
  const catBreakdown: CatEntry[] = [...catMap.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  const catMax = catBreakdown[0]?.total ?? 1;

  // Monthly trend (last 6 months)
  type MonthEntry = { month: string; income: number; expense: number };
  const trendMap = new Map<string, MonthEntry>();
  for (const row of trendRaw ?? []) {
    const entry = trendMap.get(row.period_month) ?? { month: row.period_month, income: 0, expense: 0 };
    if (row.type === "ingreso") entry.income += Number(row.total_amount);
    else if (row.type === "gasto") entry.expense += Number(row.total_amount);
    trendMap.set(row.period_month, entry);
  }
  const allMonths: MonthEntry[] = [];
  let cur = sixMonthsAgo;
  while (cur <= periodMonth) {
    allMonths.push(trendMap.get(cur) ?? { month: cur, income: 0, expense: 0 });
    cur = addMonths(cur, 1);
  }

  // Goal contributions from tagged transactions
  const contributedByGoal = new Map<string, number>();
  for (const t of goalContributions ?? []) {
    if (!t.goal_id) continue;
    contributedByGoal.set(t.goal_id, (contributedByGoal.get(t.goal_id) ?? 0) + Number(t.amount));
  }

  // Goals sorted by target_date (nulls last)
  const sortedGoals = [...(goals ?? [])].sort((a, b) => {
    if (!a.target_date && !b.target_date) return 0;
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return a.target_date.localeCompare(b.target_date);
  });

  const firstName = user?.email?.split("@")[0];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola{firstName ? `, ${firstName}` : ""} 👋</h1>
        <p className="text-sm text-muted-foreground">Este es tu resumen financiero.</p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Patrimonio neto</CardDescription>
          <CardTitle className="text-3xl">{currency.format(netWorth)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Suma de saldos de todas tus cuentas, incluyendo deudas de tarjetas de crédito.
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <ArrowUpRight className="size-4 text-emerald-500" /> Ingresos del mes
            </CardDescription>
            <CardTitle className="text-xl">{currency.format(monthIncome)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <ArrowDownRight className="size-4 text-rose-500" /> Gastos del mes
            </CardDescription>
            <CardTitle className="text-xl">{currency.format(monthExpense)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {catBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoría este mes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {catBreakdown.map((cat) => (
              <div key={cat.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">
                    {currency.format(cat.total)}{" "}
                    <span className="text-xs">({monthExpense > 0 ? Math.round((cat.total / monthExpense) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-rose-400"
                    style={{ width: `${Math.round((cat.total / catMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendencia últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground mb-1">
            <span>Mes</span>
            <span className="text-right">Ingresos</span>
            <span className="text-right">Gastos</span>
          </div>
          {allMonths.map((m) => (
            <div key={m.month} className="grid grid-cols-3 items-center text-sm">
              <span className="capitalize text-muted-foreground">{monthLabel(m.month)}</span>
              <span className={cn("text-right", m.income ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                {m.income ? currency.format(m.income) : "—"}
              </span>
              <span className={cn("text-right", m.expense ? "text-rose-500" : "text-muted-foreground")}>
                {m.expense ? currency.format(m.expense) : "—"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

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
                if (monthsLeft < 0) {
                  tip = `Te faltan ${currency.format(remaining)}. La fecha objetivo ya pasó.`;
                } else if (monthsLeft === 0) {
                  tip = `Te faltan ${currency.format(remaining)}. ¡Este es el último mes!`;
                } else {
                  tip = `Te faltan ${currency.format(remaining)}. Para cumplirla necesitas ahorrar ${currency.format(Math.ceil(remaining / monthsLeft))}/mes.`;
                }
              } else {
                tip = `Te faltan ${currency.format(remaining)} para completar esta meta.`;
              }

              return (
                <div key={goal.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium text-sm">{goal.name}</span>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currency.format(current)}</span>
                    <span>{currency.format(target)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
          {!recent?.length && <CardDescription>Aún no hay movimientos registrados.</CardDescription>}
        </CardHeader>
        {!!recent?.length && (
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

type RecentTx = {
  id: string;
  type: "ingreso" | "gasto" | "transferencia";
  amount: number;
  occurred_on: string;
  notes: string | null;
  accounts: { name: string } | null;
  categories: { name: string } | null;
};

type RawRecentTx = {
  id: string;
  type: "ingreso" | "gasto" | "transferencia";
  amount: number;
  occurred_on: string;
  notes: string | null;
  accounts: { name: string }[] | { name: string } | null;
  categories: { name: string }[] | { name: string } | null;
};

function normalizeRecentTx(tx: RawRecentTx): RecentTx {
  return {
    ...tx,
    accounts: Array.isArray(tx.accounts) ? (tx.accounts[0] ?? null) : tx.accounts,
    categories: Array.isArray(tx.categories) ? (tx.categories[0] ?? null) : tx.categories,
  };
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function RecentRow({ tx }: { tx: RecentTx }) {
  const Icon = tx.type === "ingreso" ? ArrowUpRight : tx.type === "gasto" ? ArrowDownRight : ArrowLeftRight;
  const iconColor =
    tx.type === "ingreso" ? "text-emerald-500" : tx.type === "gasto" ? "text-rose-500" : "text-muted-foreground";
  const sign = tx.type === "ingreso" ? "+" : tx.type === "gasto" ? "−" : "";

  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-muted", iconColor)}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {tx.notes || tx.categories?.name || tx.accounts?.name || "Movimiento"}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {formatDateOnly(tx.occurred_on)} · {tx.accounts?.name}
        </span>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold", iconColor)}>
        {sign}
        {currency.format(tx.amount)}
      </span>
    </div>
  );
}
