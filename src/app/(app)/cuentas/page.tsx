import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, PiggyBank, Banknote, TrendingUp, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const TYPE_LABEL: Record<string, string> = {
  debito: "Cuenta de débito",
  ahorro: "Ahorros",
  credito: "Tarjeta de crédito",
  efectivo: "Efectivo",
  inversion: "Inversión",
};

const TYPE_ICON: Record<string, typeof Wallet> = {
  debito: Wallet,
  ahorro: PiggyBank,
  credito: CreditCard,
  efectivo: Banknote,
  inversion: TrendingUp,
};

export default async function CuentasPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: balances }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, institution")
      .is("archived_at", null)
      .order("sort_order"),
    supabase.from("account_balances").select("id, current_balance"),
  ]);

  const balanceById = new Map((balances ?? []).map((b) => [b.id, Number(b.current_balance)]));
  const rows = (accounts ?? []).map((a) => ({ ...a, balance: balanceById.get(a.id) ?? 0 }));
  const netWorth = rows.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
        <Button render={<Link href="/cuentas/nueva" />} size="sm" variant="outline">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <span className="text-sm text-muted-foreground">Patrimonio neto</span>
          <span className="text-xl font-semibold">{currency.format(netWorth)}</span>
        </CardContent>
      </Card>

      {!rows.length && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aún no tienes cuentas. Crea la primera con el botón &quot;Nueva&quot;.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((account) => {
          const Icon = TYPE_ICON[account.type] ?? Wallet;
          const isDebt = account.balance < 0;
          return (
            <Link key={account.id} href={`/cuentas/${account.id}`}>
              <Card className="transition-colors active:bg-muted/60">
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{account.name}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-normal">
                        {TYPE_LABEL[account.type] ?? account.type}
                      </Badge>
                      {account.institution && <span className="truncate">{account.institution}</span>}
                    </span>
                  </div>
                  <span className={cn("shrink-0 text-base font-semibold", isDebt && "text-rose-500")}>
                    {currency.format(account.balance)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        Las tarjetas de crédito muestran el saldo como deuda (en rojo): un valor negativo significa que debes ese
        monto.
      </p>
    </div>
  );
}
