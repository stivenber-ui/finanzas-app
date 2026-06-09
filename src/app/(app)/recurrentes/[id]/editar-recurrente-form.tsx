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

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "ingreso" | "gasto" };
type MovementType = "gasto" | "ingreso" | "transferencia";
type Recurrente = {
  id: string;
  type: MovementType;
  amount: number;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  description: string | null;
  frequency: string;
  next_date: string;
  end_date: string | null;
  active: boolean;
};

const amountFormatter = new Intl.NumberFormat("es-CO");

const FREQ_OPTIONS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

export function EditarRecurrenteForm({
  recurrente,
  accounts,
  categories,
}: {
  recurrente: Recurrente;
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<MovementType>(recurrente.type);
  const [amount, setAmount] = useState(amountFormatter.format(Number(recurrente.amount)));
  const [accountId, setAccountId] = useState(recurrente.account_id);
  const [toAccountId, setToAccountId] = useState(recurrente.to_account_id ?? "");
  const [categoryId, setCategoryId] = useState(recurrente.category_id ?? "");
  const [description, setDescription] = useState(recurrente.description ?? "");
  const [frequency, setFrequency] = useState(recurrente.frequency);
  const [nextDate, setNextDate] = useState(recurrente.next_date);
  const [endDate, setEndDate] = useState(recurrente.end_date ?? "");
  const [active, setActive] = useState(recurrente.active);
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
  const freqItems = useMemo(() => FREQ_OPTIONS.map((o) => ({ value: o.value, label: o.label })), []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!numericAmount || numericAmount <= 0) { toast.error("Monto inválido"); return; }

    setLoading(true);
    const { error } = await supabase
      .from("recurring_transactions")
      .update({
        type,
        amount: numericAmount,
        account_id: accountId,
        to_account_id: type === "transferencia" ? toAccountId : null,
        category_id: type !== "transferencia" ? categoryId || null : null,
        description: description.trim() || null,
        frequency,
        next_date: nextDate,
        end_date: endDate || null,
        active,
      })
      .eq("id", recurrente.id);
    setLoading(false);

    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Recurrente actualizada");
    router.refresh();
    router.replace("/recurrentes");
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta recurrente? Los movimientos ya registrados no se borrarán.")) return;
    setDeleting(true);
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", recurrente.id);
    setDeleting(false);
    if (error) { toast.error("No se pudo eliminar", { description: error.message }); return; }
    toast.success("Recurrente eliminada");
    router.refresh();
    router.replace("/recurrentes");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Tabs value={type} onValueChange={(v) => { setType(v as MovementType); setCategoryId(""); setToAccountId(""); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gasto">Gasto</TabsTrigger>
              <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
              <TabsTrigger value="transferencia">Transferencia</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{type === "transferencia" ? "Desde" : "Cuenta"}</Label>
            <Select value={accountId} items={accountItems} onValueChange={(v) => setAccountId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona una cuenta" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {type === "transferencia" && (
            <div className="flex flex-col gap-2">
              <Label>Hacia</Label>
              <Select value={toAccountId} items={destItems} onValueChange={(v) => setToAccountId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Cuenta destino" /></SelectTrigger>
                <SelectContent>{destinationAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {type !== "transferencia" && (
            <div className="flex flex-col gap-2">
              <Label>Categoría (opcional)</Label>
              <Select value={categoryId} items={categoryItems} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>{filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input id="description" placeholder="Ej. Netflix" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Frecuencia</Label>
            <Select value={frequency} items={freqItems} onValueChange={(v) => setFrequency(v ?? "mensual")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{FREQ_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="next_date">Próxima ocurrencia</Label>
            <Input id="next_date" type="date" required value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="end_date">Fecha de fin (opcional)</Label>
            <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive(!active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <Label className="cursor-pointer" onClick={() => setActive(!active)}>
              {active ? "Activa" : "Inactiva"}
            </Label>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" size="lg" disabled={loading || deleting}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" size="lg" disabled={loading || deleting} onClick={handleDelete} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950">
              <Trash2 className="size-4" />
              {deleting ? "Eliminando..." : "Eliminar recurrente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
