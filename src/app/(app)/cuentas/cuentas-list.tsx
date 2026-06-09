"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown, Check, X, ChevronRight, Wallet, CreditCard, PiggyBank, Banknote, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type AccountRow = {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  balance: number;
  archived_at: string | null;
  sort_order: number;
};

export function CuentasList({
  active,
  archived,
}: {
  active: AccountRow[];
  archived: AccountRow[];
}) {
  const [isReordering, setIsReordering] = useState(false);
  const [localActive, setLocalActive] = useState(active);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isReordering) setLocalActive(active);
  }, [active, isReordering]);

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...localActive];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setLocalActive(next);
  }

  function moveDown(index: number) {
    if (index === localActive.length - 1) return;
    const next = [...localActive];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setLocalActive(next);
  }

  async function saveOrder() {
    setSaving(true);
    await Promise.all(
      localActive.map((row, i) =>
        supabase.from("accounts").update({ sort_order: i + 1 }).eq("id", row.id),
      ),
    );
    setSaving(false);
    setIsReordering(false);
    router.refresh();
  }

  function cancelReorder() {
    setLocalActive(active);
    setIsReordering(false);
  }

  const rows = isReordering ? localActive : active;

  return (
    <>
      <div className="flex justify-end">
        {isReordering ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelReorder} disabled={saving}>
              <X className="size-4" />
              Cancelar
            </Button>
            <Button size="sm" onClick={saveOrder} disabled={saving}>
              <Check className="size-4" />
              {saving ? "Guardando..." : "Guardar orden"}
            </Button>
          </div>
        ) : (
          active.length >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setIsReordering(true)}
            >
              Reordenar
            </Button>
          )
        )}
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((account, i) => (
          <AccountRow
            key={account.id}
            account={account}
            reorderMode={isReordering}
            isFirst={i === 0}
            isLast={i === rows.length - 1}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
          />
        ))}
      </div>

      {archived.length > 0 && !isReordering && (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Archivadas
          </p>
          {archived.map((account) => (
            <AccountRow key={account.id} account={account} muted />
          ))}
        </div>
      )}
    </>
  );
}

function AccountRow({
  account,
  muted = false,
  reorderMode = false,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
}: {
  account: AccountRow;
  muted?: boolean;
  reorderMode?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const Icon = TYPE_ICON[account.type] ?? Wallet;
  const isDebt = account.balance < 0;

  const inner = (
    <Card className={cn("transition-colors", !reorderMode && "active:bg-muted/60", muted && "opacity-60")}>
      <CardContent className="flex items-center gap-3 pt-6">
        {reorderMode && (
          <div className="flex shrink-0 flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Mover arriba"
              className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Mover abajo"
              className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
            >
              <ArrowDown className="size-4" />
            </button>
          </div>
        )}
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
        {!reorderMode && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
      </CardContent>
    </Card>
  );

  if (reorderMode) return inner;
  return <Link href={`/cuentas/${account.id}`}>{inner}</Link>;
}
