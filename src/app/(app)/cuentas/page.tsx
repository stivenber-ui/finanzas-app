import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CuentasList } from "./cuentas-list";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function CuentasPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: balances }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, institution, archived_at, sort_order")
      .order("sort_order"),
    supabase.from("account_balances").select("id, current_balance"),
  ]);

  const balanceById = new Map((balances ?? []).map((b) => [b.id, Number(b.current_balance)]));
  const allRows = (accounts ?? []).map((a) => ({ ...a, balance: balanceById.get(a.id) ?? 0 }));
  const activeRows = allRows.filter((a) => !a.archived_at);
  const archivedRows = allRows.filter((a) => !!a.archived_at);
  const netWorth = (balances ?? []).reduce((sum, b) => sum + Number(b.current_balance), 0);

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

      {!activeRows.length && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aún no tienes cuentas activas. Crea la primera con el botón &quot;Nueva&quot;.
          </CardContent>
        </Card>
      )}

      <CuentasList active={activeRows} archived={archivedRows} />

      <p className="px-1 text-xs text-muted-foreground">
        Las tarjetas de crédito muestran el saldo como deuda (en rojo): un valor negativo significa que debes ese
        monto.
      </p>
    </div>
  );
}
