"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function todayLocalISODate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

  const [type, setType] = useState<"ingreso" | "gasto">("ingreso");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [occurredOn, setOccurredOn] = useState(todayLocalISODate());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const accountsById = new Map(accounts.map((a) => [a.id, a.name]));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!numericAmount || numericAmount <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!accountId) { toast.error("Selecciona una cuenta"); return; }

    setLoading(true);
    const { error } = await supabase.from("transactions").insert({
      type,
      amount: numericAmount,
      account_id: accountId,
      category_id: null,
      goal_id: goalId,
      occurred_on: occurredOn,
      notes: notes.trim() || null,
    });
    setLoading(false);

    if (error) { toast.error("No se pudo registrar el aporte", { description: error.message }); return; }
    toast.success(type === "ingreso" ? "Aporte registrado" : "Retiro registrado");
    setAmount("");
    setNotes("");
    router.refresh();
  }

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
        <CardTitle className="text-base">Aportes y retiros</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Tabs value={type} onValueChange={(v) => setType(v as "ingreso" | "gasto")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingreso">Aporte</TabsTrigger>
              <TabsTrigger value="gasto">Retiro</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contribution-amount">Monto</Label>
            <Input id="contribution-amount" inputMode="decimal" placeholder="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          {accounts.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Cuenta</Label>
              <Select value={accountId} items={accounts.map((a) => ({ value: a.id, label: a.name }))} onValueChange={(v) => setAccountId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="contribution-date">Fecha</Label>
            <Input id="contribution-date" type="date" required value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contribution-notes">Nota (opcional)</Label>
            <Input id="contribution-notes" placeholder="Ej. Ahorro de la quincena" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button type="submit" disabled={loading}>
            {type === "ingreso" ? <Plus className="size-4" /> : <Minus className="size-4" />}
            {loading ? "Guardando..." : type === "ingreso" ? "Agregar aporte" : "Registrar retiro"}
          </Button>
        </form>

        {contributions.length > 0 && (
          <div className="flex flex-col gap-1 border-t pt-4">
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-1.5">
                <Link href={`/movimientos/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm">{c.notes || (c.type === "ingreso" ? "Aporte" : "Retiro")}</span>
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
