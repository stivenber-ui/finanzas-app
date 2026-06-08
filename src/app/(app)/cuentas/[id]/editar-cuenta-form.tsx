"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive } from "lucide-react";
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

type Account = {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  initial_balance: number;
  credit_limit: number | null;
  sort_order: number;
};

function formatForInput(value: number): string {
  return value === 0 ? "0" : String(value);
}

function parseAmount(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export function EditarCuentaForm({ account }: { account: Account }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(account.name);
  const [type, setType] = useState(account.type);
  const [institution, setInstitution] = useState(account.institution ?? "");
  const [initialBalance, setInitialBalance] = useState(formatForInput(Number(account.initial_balance)));
  const [creditLimit, setCreditLimit] = useState(account.credit_limit ? formatForInput(Number(account.credit_limit)) : "");
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("accounts")
      .update({
        name: name.trim(),
        type,
        institution: institution.trim() || null,
        initial_balance: parseAmount(initialBalance),
        credit_limit: creditLimit ? parseAmount(creditLimit) : null,
      })
      .eq("id", account.id);
    setLoading(false);

    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Cuenta actualizada");
    router.replace("/cuentas");
    router.refresh();
  }

  async function handleArchive() {
    if (!window.confirm("¿Archivar esta cuenta? Seguirá visible en el historial pero ya no aparecerá en los formularios.")) return;
    setArchiving(true);
    const { error } = await supabase.from("accounts").update({ archived_at: new Date().toISOString() }).eq("id", account.id);
    setArchiving(false);
    if (error) { toast.error("No se pudo archivar", { description: error.message }); return; }
    toast.success("Cuenta archivada");
    router.replace("/cuentas");
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
            <Label>Tipo</Label>
            <Select value={type} items={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))} onValueChange={(v) => setType(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
            <Input id="institution" placeholder="Ej. Bancolombia, Nu..." value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="initial_balance">Saldo inicial</Label>
            {type === "credito" && (
              <p className="text-xs text-muted-foreground">Para tarjetas de crédito la deuda va como número negativo (ej. -500000).</p>
            )}
            <Input id="initial_balance" inputMode="decimal" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
          </div>

          {type === "credito" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="credit_limit">Cupo total (opcional)</Label>
              <Input id="credit_limit" inputMode="decimal" placeholder="Ej. 10000000" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" size="lg" disabled={loading || archiving}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={loading || archiving}
              onClick={handleArchive}
              className="text-muted-foreground"
            >
              <Archive className="size-4" />
              {archiving ? "Archivando..." : "Archivar cuenta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
