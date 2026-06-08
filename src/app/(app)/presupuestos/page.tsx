import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

const STATUS_LABEL: Record<string, string> = {
  activa: "Activa",
  completada: "Completada",
  pausada: "Pausada",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  activa: "default",
  completada: "secondary",
  pausada: "outline",
};

export default async function MetasPage() {
  const supabase = await createClient();

  const [{ data: goals }, { data: contributions }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, target_amount, initial_amount, target_date, status")
      .order("created_at"),
    supabase.from("transactions").select("goal_id, amount").not("goal_id", "is", null),
  ]);

  const contributedByGoal = new Map<string, number>();
  for (const t of contributions ?? []) {
    if (!t.goal_id) continue;
    contributedByGoal.set(t.goal_id, (contributedByGoal.get(t.goal_id) ?? 0) + Number(t.amount));
  }

  const rows = (goals ?? []).map((g) => {
    const current = Number(g.initial_amount) + (contributedByGoal.get(g.id) ?? 0);
    const target = Number(g.target_amount);
    const progress = target > 0 ? Math.min(1, current / target) : 0;
    return { ...g, current, target, progress };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>

      {!rows.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin metas todavía</CardTitle>
            <CardDescription>Define cuánto quieres ahorrar para tus objetivos.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{goal.name}</CardTitle>
                <Badge variant={STATUS_VARIANT[goal.status] ?? "outline"}>
                  {STATUS_LABEL[goal.status] ?? goal.status}
                </Badge>
              </div>
              {goal.target_date && <CardDescription>Fecha objetivo: {formatDateOnly(goal.target_date)}</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    goal.status === "completada" ? "bg-emerald-500" : "bg-primary",
                  )}
                  style={{ width: `${Math.round(goal.progress * 100)}%` }}
                />
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{currency.format(goal.current)}</span>
                <span className="text-muted-foreground">de {currency.format(goal.target)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{Math.round(goal.progress * 100)}% completado</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
