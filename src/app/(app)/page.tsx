import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function startOfMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const periodMonth = startOfMonth(new Date());

  const [{ data: balances }, { data: totals }, { data: recent }] = await Promise.all([
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
  ]);

  const netWorth = (balances ?? []).reduce((sum, a) => sum + Number(a.current_balance), 0);
  const monthIncome = (totals ?? [])
    .filter((t) => t.type === "ingreso")
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  const monthExpense = (totals ?? [])
    .filter((t) => t.type === "gasto")
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

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
