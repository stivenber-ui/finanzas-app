"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

type Account = { id: string; name: string };
type Contribution = {
  id: string;
  type: "ingreso" | "gasto";
  amount: number;
  occurred_on: string;
  notes: string | null;
  account_id: string;
};

const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const dateFormatter = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
function formatDateOnly(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

export function GoalContributions({
  goalId,
  accounts,
  contributions,
}: {
  goalId: string;
  accounts: Account[];
  contributions: Contribution[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const accountsById = new Map(accounts.map((a) => [a.id, a.name]));

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este movimiento de la meta?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setDeletingId(null);
    if (error) { toast.error("No se pudo eliminar", { description: error.message }); return; }
    toast.success("Movimiento eliminado");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimientos de esta meta</CardTitle>
        <CardAction>
          <Button render={<Link href={`/movimientos/nuevo?meta=${goalId}`} />} size="sm" variant="outline">
            <Plus className="size-4" />
            Registrar
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {contributions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin movimientos todavía"
            description='Usa "Registrar" para anotar un pago o aporte y vincularlo a esta meta.'
          />
        ) : (
          <div className="flex flex-col gap-1">
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-1.5">
                <Link href={`/movimientos/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm">{c.notes || (c.type === "ingreso" ? "Ingreso" : "Gasto")}</span>
                    <span className="text-xs text-muted-foreground">{formatDateOnly(c.occurred_on)} · {accountsById.get(c.account_id) ?? "Cuenta"}</span>
                  </div>
                  <span className={c.type === "ingreso" ? "text-sm font-medium text-emerald-500" : "text-sm font-medium text-rose-500"}>
                    {c.type === "ingreso" ? "+" : "-"}{currency.format(c.amount)}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
                <button
                  type="button"
                  aria-label="Eliminar"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c.id)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
