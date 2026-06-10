import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavingsGoalCard } from "./savings-goal-card";
import { CategoryBudgets } from "./category-budgets";

function startOfMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function addMonths(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function PresupuestoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const periodMonth = startOfMonth(new Date());
  const nextMonthStart = addMonths(periodMonth, 1);

  const rawMonthLabel = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(
    new Date(Number(periodMonth.slice(0, 4)), Number(periodMonth.slice(5, 7)) - 1, 1)
  );
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  const [
    { data: totals },
    { data: settings },
    { data: categories },
    { data: spendTxs },
  ] = await Promise.all([
    supabase
      .from("monthly_category_totals")
      .select("type, total_amount")
      .eq("period_month", periodMonth)
      .in("type", ["ingreso", "gasto"]),
    supabase.from("user_settings").select("monthly_savings_goal").maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, monthly_budget")
      .eq("kind", "gasto")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("transactions")
      .select("amount, categories(id)")
      .eq("type", "gasto")
      .gte("occurred_on", periodMonth)
      .lt("occurred_on", nextMonthStart),
  ]);

  const monthIncome = (totals ?? []).filter((t) => t.type === "ingreso").reduce((s, t) => s + Number(t.total_amount), 0);
  const monthExpense = (totals ?? []).filter((t) => t.type === "gasto").reduce((s, t) => s + Number(t.total_amount), 0);
  const saved = monthIncome - monthExpense;

  const spendByCategory = new Map<string, number>();
  for (const tx of spendTxs ?? []) {
    const cats = tx.categories as { id: string } | { id: string }[] | null;
    const catId = Array.isArray(cats) ? (cats[0]?.id ?? null) : (cats?.id ?? null);
    if (catId) spendByCategory.set(catId, (spendByCategory.get(catId) ?? 0) + Number(tx.amount));
  }

  const categoryRows = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    monthly_budget: c.monthly_budget != null ? Number(c.monthly_budget) : null,
    spent: spendByCategory.get(c.id) ?? 0,
  })).sort((a, b) => {
    if (a.monthly_budget != null && b.monthly_budget == null) return -1;
    if (a.monthly_budget == null && b.monthly_budget != null) return 1;
    return b.spent - a.spent;
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Presupuesto</h1>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
      </div>

      <SavingsGoalCard
        userId={user!.id}
        goal={settings?.monthly_savings_goal != null ? Number(settings.monthly_savings_goal) : null}
        saved={saved}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Presupuesto por categoría</CardTitle>
          <p className="text-xs text-muted-foreground">Usa el lápiz para asignar un límite mensual a cada categoría.</p>
        </CardHeader>
        <CardContent>
          <CategoryBudgets categories={categoryRows} />
        </CardContent>
      </Card>
    </div>
  );
}
