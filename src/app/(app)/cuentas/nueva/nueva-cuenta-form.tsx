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

const ACCOUNT_TYPES = [
  { value: "debito", label: "Cuenta de débito" },
  { value: "ahorro", label: "Ahorros" },
  { value: "credito", label: "Tarjeta de crédito" },
  { value: "efectivo", label: "Efectivo" },
  { value: "inversion", label: "Inversión" },
];

export function NuevaCuentaForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [institution, setInstitution] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [creditLimit, setCreditLimit] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!type) { toast.error("Selecciona el tipo de cuenta"); return; }

    const numericBalance = parseAmount(initialBalance);
    const numericLimit = creditLimit ? parseAmount(creditLimit) : null;

    setLoading(true);
    const { error } = await supabase.from("accounts").insert({
      name: name.trim(),
      type,
      institution: institution.trim() || null,
      initial_balance: numericBalance,
      credit_limit: numericLimit,
    });
    setLoading(false);

    if (error) { toast.error("No se pudo crear la cuenta", { description: error.message }); return; }
    toast.success("Cuenta creada");
    router.replace("/cuentas");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej. Bancolombia" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={type} items={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))} onValueChange={(v) => setType(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="institution">Entidad (opcional)</Label>
            <Input id="institution" placeholder="Ej. Bancolombia, Nu, Nequi..." value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="initial_balance">Saldo inicial</Label>
            {type === "credito" && (
              <p className="text-xs text-muted-foreground">Para tarjetas de crédito ingresa la deuda como número negativo (ej. -500000).</p>
            )}
            <Input id="initial_balance" inputMode="decimal" placeholder="0" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
          </div>

          {type === "credito" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="credit_limit">Cupo total (opcional)</Label>
              <Input id="credit_limit" inputMode="decimal" placeholder="Ej. 10000000" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Guardando..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function parseAmount(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", "."));
}
