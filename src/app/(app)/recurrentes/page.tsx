import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplyPendingButton } from "./apply-pending-button";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FREQ_LABEL: Record<string, string> = {
  semanal: "Semanal",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const TYPE_COLOR: Record<string, string> = {
  gasto: "text-rose-500",
  ingreso: "text-emerald-600 dark:text-emerald-400",
  transferencia: "text-muted-foreground",
};

export default async function RecurrentesPage() {
  const supabase = await createClient();

  const { data: recurrentes } = await supabase
    .from("recurring_transactions")
    .select("id, type, amount, description, frequency, next_date, active, account:accounts!recurring_transactions_account_id_fkey(name), category:categories(name)")
    .order("next_date");

  const today = new Date().toISOString().slice(0, 10);
  const pending = (recurrentes ?? []).filter((r) => r.active && r.next_date <= today);
  const active = (recurrentes ?? []).filter((r) => r.active && r.next_date > today);
  const inactive = (recurrentes ?? []).filter((r) => !r.active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recurrentes</h1>
          <p className="text-xs text-muted-foreground">Gastos e ingresos que se repiten</p>
        </div>
        <Button render={<Link href="/recurrentes/nueva" />} size="sm" variant="outline">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      {pending.length > 0 && (
        <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {pending.length} recurrente{pending.length > 1 ? "s" : ""} pendiente{pending.length > 1 ? "s" : ""} de aplicar
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {pending.map((r) => {
                const account = Array.isArray(r.account) ? r.account[0] : r.account;
                const category = Array.isArray(r.category) ? r.category[0] : r.category;
                return (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <span className="truncate font-medium">{r.description || (category as { name: string } | null)?.name || "Sin nombre"}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{r.next_date}</span>
                    </div>
                    <span className={cn("shrink-0 font-semibold", TYPE_COLOR[r.type])}>{currency.format(r.amount)}</span>
                  </div>
                );
              })}
            </div>
            <ApplyPendingButton pending={pending.map((r) => r.id)} />
          </CardContent>
        </Card>
      )}

      {!recurrentes?.length && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <RefreshCw className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Sin recurrentes todavía</p>
              <p className="text-xs text-muted-foreground">Registra gastos o ingresos que se repiten para no olvidarlos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Próximas</p>
          {active.map((r) => <RecurrenteRow key={r.id} r={r} />)}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Inactivas</p>
          {inactive.map((r) => <RecurrenteRow key={r.id} r={r} muted />)}
        </div>
      )}
    </div>
  );
}

type RecRow = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  frequency: string;
  next_date: string;
  active: boolean;
  account: { name: string } | { name: string }[] | null;
  category: { name: string } | { name: string }[] | null;
};

function RecurrenteRow({ r, muted = false }: { r: RecRow; muted?: boolean }) {
  const account = Array.isArray(r.account) ? r.account[0] : r.account;
  const category = Array.isArray(r.category) ? r.category[0] : r.category;
  const label = r.description || (category as { name: string } | null)?.name || "Sin nombre";

  return (
    <Link href={`/recurrentes/${r.id}`}>
      <Card className={cn("transition-colors active:bg-muted/60", muted && "opacity-60")}>
        <CardContent className="flex items-center gap-3 pt-4 pb-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{label}</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-normal text-xs">{FREQ_LABEL[r.frequency] ?? r.frequency}</Badge>
              <span>{(account as { name: string } | null)?.name}</span>
              <span>· {r.next_date}</span>
            </div>
          </div>
          <span className={cn("shrink-0 font-semibold", TYPE_COLOR[r.type])}>{currency.format(r.amount)}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
