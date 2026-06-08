"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export function NuevaMetaForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("0");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = Number(targetAmount.replace(/\./g, "").replace(",", "."));
    if (!target || target <= 0) { toast.error("Ingresa un monto objetivo válido"); return; }

    setLoading(true);
    const { error } = await supabase.from("goals").insert({
      name: name.trim(),
      target_amount: target,
      initial_amount: Number(initialAmount.replace(/\./g, "").replace(",", ".")) || 0,
      target_date: targetDate || null,
      account_id: accountId || null,
      status: "activa",
    });
    setLoading(false);

    if (error) { toast.error("No se pudo crear la meta", { description: error.message }); return; }
    toast.success("Meta creada");
    router.refresh();
    router.replace("/presupuestos");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre de la meta</Label>
            <Input id="name" placeholder="Ej. Fondo de emergencia" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="target_amount">Monto objetivo</Label>
            <Input id="target_amount" inputMode="decimal" placeholder="Ej. 5000000" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="initial_amount">Monto inicial (ya ahorrado)</Label>
            <Input id="initial_amount" inputMode="decimal" placeholder="0" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="target_date">Fecha objetivo (opcional)</Label>
            <Input id="target_date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cuenta asociada (opcional)</Label>
            <Select value={accountId || "_none"} items={[{value:"_none",label:"Sin cuenta específica"},...accounts.map((a) => ({value:a.id,label:a.name}))]} onValueChange={(v) => setAccountId(!v || v === "_none" ? "" : v)}>
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

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Guardando..." : "Crear meta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
