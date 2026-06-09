"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

const amountFormatter = new Intl.NumberFormat("es-CO");

const FREQ_OPTIONS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

export function NuevaRecurrenteForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<MovementType>("gasto");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("mensual");
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!numericAmount || numericAmount <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!accountId) { toast.error("Selecciona una cuenta"); return; }
    if (type === "transferencia" && !toAccountId) { toast.error("Selecciona la cuenta destino"); return; }
    if (!frequency) { toast.error("Selecciona la frecuencia"); return; }

    setLoading(true);
    const { error } = await supabase.from("recurring_transactions").insert({
      type,
      amount: numericAmount,
      account_id: accountId,
      to_account_id: type === "transferencia" ? toAccountId : null,
      category_id: type !== "transferencia" ? categoryId || null : null,
      description: description.trim() || null,
      frequency,
      next_date: nextDate,
      end_date: endDate || null,
      active: true,
    });
    setLoading(false);

    if (error) { toast.error("No se pudo crear", { description: error.message }); return; }
    toast.success("Recurrente creada");
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
            <Input id="amount" inputMode="decimal" placeholder="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
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
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona la cuenta destino" /></SelectTrigger>
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
            <Input id="description" placeholder="Ej. Netflix, Arriendo" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Frecuencia</Label>
            <Select value={frequency} items={freqItems} onValueChange={(v) => setFrequency(v ?? "mensual")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{FREQ_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="next_date">Primera ocurrencia</Label>
            <Input id="next_date" type="date" required value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="end_date">Fecha de fin (opcional)</Label>
            <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Guardando..." : "Crear recurrente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
