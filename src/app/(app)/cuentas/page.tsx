import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, ChevronRight, Package } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CuentasList } from "./cuentas-list";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function CuentasPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: balances }, { data: assets }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, institution, archived_at, sort_order")
      .order("sort_order"),
    supabase.from("account_balances").select("id, current_balance"),
    supabase.from("assets").select("current_value").is("archived_at", null),
  ]);

  const balanceById = new Map((balances ?? []).map((b) => [b.id, Number(b.current_balance)]));
  const allRows = (accounts ?? []).map((a) => ({ ...a, balance: balanceById.get(a.id) ?? 0 }));
  const activeRows = allRows.filter((a) => !a.archived_at);
  const archivedRows = allRows.filter((a) => !!a.archived_at);
  const liquidNetWorth = (balances ?? []).reduce((sum, b) => sum + Number(b.current_balance), 0);
  const assetsValue = (assets ?? []).reduce((sum, a) => sum + Number(a.current_value), 0);

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
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Patrimonio neto</span>
            <span className="text-xl font-semibold">{currency.format(liquidNetWorth)}</span>
          </div>
          <Link href="/bienes" className="flex items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground">
            <span className="flex items-center gap-1.5">
              <Package className="size-3.5" />
              Bienes ({currency.format(assetsValue)}) — aparte del patrimonio líquido
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      {!activeRows.length && (
        <Card>
          <CardContent>
            <EmptyState
              icon={Wallet}
              title="Aún no tienes cuentas activas"
              description='Crea la primera con el botón "Nueva".'
            />
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
