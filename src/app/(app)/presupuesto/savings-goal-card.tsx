"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CircleProgress } from "@/components/circle-progress";

const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const amountFmt = new Intl.NumberFormat("es-CO");

export function SavingsGoalCard({
  userId,
  goal,
  saved,
}: {
  userId: string;
  goal: number | null;
  saved: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal != null ? amountFmt.format(goal) : "");
  const [loading, setLoading] = useState(false);

  const pct = goal && goal > 0 ? Math.round((Math.max(0, saved) / goal) * 100) : null;
  const color = pct == null ? "#9ca3af" : pct >= 100 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#60a5fa";

  async function save() {
    const num = Number(value.replace(/\./g, "").replace(",", "."));
    if (isNaN(num) || num < 0) { toast.error("Monto inválido"); return; }
    setLoading(true);
    const { error } = await supabase.from("user_settings").upsert({ user_id: userId, monthly_savings_goal: num || null }, { onConflict: "user_id" });
    setLoading(false);
    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Meta actualizada");
    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setValue(goal != null ? amountFmt.format(goal) : "");
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-base">Meta de ahorro mensual</CardTitle>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
            <Pencil className="size-3.5" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">¿Cuánto quieres ahorrar este mes?</p>
            <Input
              inputMode="decimal"
              placeholder="Ej. 500.000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={loading} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50">
                <Check className="size-4" /> Guardar
              </button>
              <button type="button" onClick={cancel} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted py-2 text-sm font-medium transition-colors hover:bg-muted/80">
                <X className="size-4" /> Cancelar
              </button>
            </div>
          </div>
        ) : goal != null ? (
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <CircleProgress pct={Math.min(100, pct ?? 0)} size={72} stroke={7} color={color} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct ?? 0}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{currency.format(Math.max(0, saved))} <span className="font-normal text-muted-foreground">de</span> {currency.format(goal)}</p>
              {saved >= goal ? (
                <p className="text-xs text-emerald-500 font-medium">¡Meta alcanzada este mes!</p>
              ) : (
                <p className="text-xs text-muted-foreground">Faltan {currency.format(goal - Math.max(0, saved))} para completar la meta</p>
              )}
              <p className="text-xs text-muted-foreground">Ahorro = ingresos − gastos del mes</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-muted-foreground">No tienes una meta de ahorro configurada.</p>
            <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-primary underline-offset-2 hover:underline">
              Configurar meta
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
