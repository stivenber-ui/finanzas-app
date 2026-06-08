"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = { id: string; name: string };
type Goal = {
  id: string;
  name: string;
  target_amount: number;
  initial_amount: number;
  target_date: string | null;
  account_id: string | null;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "activa", label: "Activa" },
  { value: "completada", label: "Completada" },
  { value: "pausada", label: "Pausada" },
];

export function EditarMetaForm({ goal, accounts }: { goal: Goal; accounts: Account[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(String(Number(goal.target_amount)));
  const [initialAmount, setInitialAmount] = useState(String(Number(goal.initial_amount)));
  const [targetDate, setTargetDate] = useState(goal.target_date?.slice(0, 10) ?? "");
  const [accountId, setAccountId] = useState(goal.account_id ?? "");
  const [status, setStatus] = useState(goal.status);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = Number(targetAmount.replace(/\./g, "").replace(",", "."));
    if (!target || target <= 0) { toast.error("Monto objetivo inválido"); return; }

    setLoading(true);
    const { error } = await supabase
      .from("goals")
      .update({
        name: name.trim(),
        target_amount: target,
        initial_amount: Number(initialAmount.replace(/\./g, "").replace(",", ".")) || 0,
        target_date: targetDate || null,
        account_id: accountId || null,
        status,
      })
      .eq("id", goal.id);
    setLoading(false);

    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Meta actualizada");
    router.replace("/presupuestos");
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta meta? Los movimientos vinculados quedarán sin meta asignada.")) return;
    setDeleting(true);
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    setDeleting(false);
    if (error) { toast.error("No se pudo eliminar", { description: error.message }); return; }
    toast.success("Meta eliminada");
    router.replace("/presupuestos");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="target_amount">Monto objetivo</Label>
            <Input id="target_amount" inputMode="decimal" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="initial_amount">Monto inicial</Label>
            <Input id="initial_amount" inputMode="decimal" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="target_date">Fecha objetivo (opcional)</Label>
            <Input id="target_date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cuenta asociada (opcional)</Label>
            <Select value={accountId || "_none"} onValueChange={(v) => setAccountId(!v || v === "_none" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin cuenta específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin cuenta específica</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" size="lg" disabled={loading || deleting}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={loading || deleting}
              onClick={handleDelete}
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
            >
              <Trash2 className="size-4" />
              {deleting ? "Eliminando..." : "Eliminar meta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
