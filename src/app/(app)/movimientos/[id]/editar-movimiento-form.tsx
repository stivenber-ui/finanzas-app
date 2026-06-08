"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = { id: string; name: string; type: string };
type Category = { id: string; name: string; kind: "ingreso" | "gasto" };
type Goal = { id: string; name: string };
type MovementType = "gasto" | "ingreso" | "transferencia";
type Transaction = {
  id: string;
  type: MovementType;
  amount: number;
  occurred_on: string;
  notes: string | null;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  goal_id: string | null;
};

const amountFormatter = new Intl.NumberFormat("es-CO");
const GOAL_NONE = "_none";

export function EditarMovimientoForm({
  transaction,
  accounts,
  categories,
  goals,
}: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<MovementType>(transaction.type);
  const [amount, setAmount] = useState(amountFormatter.format(Number(transaction.amount)));
  const [accountId, setAccountId] = useState(transaction.account_id);
  const [toAccountId, setToAccountId] = useState(transaction.to_account_id ?? "");
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [goalId, setGoalId] = useState(transaction.goal_id ?? "");
  const [occurredOn, setOccurredOn] = useState(transaction.occurred_on.slice(0, 10));
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === (type === "gasto" ? "gasto" : "ingreso")),
    [categories, type],
  );
  const destinationAccounts = useMemo(() => accounts.filter((a) => a.id !== accountId), [accounts, accountId]);

  const accountItems = useMemo(() => accounts.map((a) => ({ value: a.id, label: a.name })), [accounts]);
  const destItems = useMemo(() => destinationAccounts.map((a) => ({ value: a.id, label: a.name })), [destinationAccounts]);
  const categoryItems = useMemo(() => filteredCategories.map((c) => ({ value: c.id, label: c.name })), [filteredCategories]);
  const goalItems = useMemo(
    () => [{ value: GOAL_NONE, label: "Sin meta" }, ...goals.map((g) => ({ value: g.id, label: g.name }))],
    [goals],
  );

  function changeType(nextType: MovementType) {
    setType(nextType);
    setCategoryId("");
    setToAccountId("");
    setGoalId("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const numericAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!numericAmount || numericAmount <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!accountId) { toast.error("Selecciona una cuenta"); return; }
    if (type === "transferencia" && !toAccountId) { toast.error("Selecciona la cuenta destino"); return; }

    setLoading(true);
    const { error } = await supabase
      .from("transactions")
      .update({
        type,
        amount: numericAmount,
        account_id: accountId,
        to_account_id: type === "transferencia" ? toAccountId : null,
        category_id: type === "transferencia" ? null : categoryId || null,
        goal_id: type !== "transferencia" ? (goalId && goalId !== GOAL_NONE ? goalId : null) : null,
        occurred_on: occurredOn,
        notes: notes.trim() || null,
      })
      .eq("id", transaction.id);
    setLoading(false);

    if (error) { toast.error("No se pudo guardar el movimiento", { description: error.message }); return; }
    toast.success("Movimiento actualizado");
    router.refresh();
    router.back();
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("transactions").delete().eq("id", transaction.id);
    setDeleting(false);
    if (error) { toast.error("No se pudo eliminar el movimiento", { description: error.message }); return; }
    toast.success("Movimiento eliminado");
    router.refresh();
    router.back();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Tabs value={type} onValueChange={(value) => changeType(value as MovementType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gasto">Gasto</TabsTrigger>
              <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
              <TabsTrigger value="transferencia">Transferencia</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" inputMode="decimal" placeholder="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{type === "transferencia" ? "Desde" : "Cuenta"}</Label>
            <Select value={accountId} items={accountItems} onValueChange={(v) => setAccountId(v ?? "")}>
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

          {type === "transferencia" && (
            <div className="flex flex-col gap-2">
              <Label>Hacia</Label>
              <Select value={toAccountId} items={destItems} onValueChange={(v) => setToAccountId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona la cuenta destino" />
                </SelectTrigger>
                <SelectContent>
                  {destinationAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== "transferencia" && (
            <div className="flex flex-col gap-2">
              <Label>Categoría</Label>
              <Select value={categoryId} items={categoryItems} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== "transferencia" && goals.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Meta (opcional)</Label>
              <Select value={goalId || GOAL_NONE} items={goalItems} onValueChange={(v) => setGoalId(!v || v === GOAL_NONE ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin meta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GOAL_NONE}>Sin meta</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="occurred_on">Fecha</Label>
            <Input id="occurred_on" type="date" required value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Nota (opcional)</Label>
            <Input id="notes" placeholder="Ej. Mercado de la semana" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
              {deleting ? "Eliminando..." : "Eliminar movimiento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
