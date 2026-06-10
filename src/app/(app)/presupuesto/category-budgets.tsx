"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const amountFmt = new Intl.NumberFormat("es-CO");

type CategoryRow = { id: string; name: string; monthly_budget: number | null; spent: number };

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const color = pct >= 100 ? "var(--negative)" : pct >= 85 ? "var(--warning)" : "var(--success)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

function CategoryBudgetRow({ cat }: { cat: CategoryRow }) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(cat.monthly_budget != null ? amountFmt.format(cat.monthly_budget) : "");
  const [loading, setLoading] = useState(false);

  const remaining = cat.monthly_budget != null ? cat.monthly_budget - cat.spent : null;
  const over = remaining != null && remaining < 0;

  async function save() {
    const num = Number(value.replace(/\./g, "").replace(",", "."));
    if (isNaN(num) || num < 0) { toast.error("Monto inválido"); return; }
    setLoading(true);
    const { error } = await supabase.from("categories").update({ monthly_budget: num || null }).eq("id", cat.id);
    setLoading(false);
    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Presupuesto actualizado");
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">{cat.name}</span>
        {!editing && (
          <Button variant="ghost" size="icon-sm" aria-label={`Editar presupuesto de ${cat.name}`} className="shrink-0 rounded-full text-muted-foreground" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            inputMode="decimal"
            placeholder="Presupuesto mensual"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <Button size="icon" aria-label="Guardar presupuesto" onClick={save} disabled={loading}>
            <Check className="size-4" />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Cancelar edición" onClick={() => { setValue(cat.monthly_budget != null ? amountFmt.format(cat.monthly_budget) : ""); setEditing(false); }}>
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Gastado: <span className="font-medium text-foreground">{currency.format(cat.spent)}</span></span>
            {cat.monthly_budget != null ? (
              <span className={cn("font-medium", over ? "text-rose-500" : "text-emerald-500")}>
                {over ? `Excedido ${currency.format(-remaining!)}` : `Disponible ${currency.format(remaining!)}`}
              </span>
            ) : (
              <span className="italic">Sin límite · toca <Pencil className="inline size-3" /> para asignar</span>
            )}
          </div>
          {cat.monthly_budget != null && <BudgetBar spent={cat.spent} budget={cat.monthly_budget} />}
        </>
      )}
    </div>
  );
}

export function CategoryBudgets({ categories }: { categories: CategoryRow[] }) {
  const withBudget = categories.filter((c) => c.monthly_budget != null);
  const withoutBudget = categories.filter((c) => c.monthly_budget == null);

  return (
    <div className="flex flex-col">
      {withBudget.length === 0 && withoutBudget.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay categorías de gasto.</p>
      )}
      {withBudget.map((cat) => <CategoryBudgetRow key={cat.id} cat={cat} />)}
      {withoutBudget.length > 0 && (
        <>
          {withBudget.length > 0 && (
            <p className="mt-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sin presupuesto asignado</p>
          )}
          {withoutBudget.map((cat) => <CategoryBudgetRow key={cat.id} cat={cat} />)}
        </>
      )}
    </div>
  );
}
