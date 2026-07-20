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
import { ASSET_CATEGORIES } from "../categories";

function parseAmount(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export function NuevoBienForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("otro");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = parseAmount(currentValue);
    if (!currentValue || isNaN(value) || value < 0) { toast.error("Ingresa un valor actual válido"); return; }

    setLoading(true);
    const { error } = await supabase.from("assets").insert({
      name: name.trim(),
      category,
      purchase_date: purchaseDate || null,
      purchase_value: purchaseValue ? parseAmount(purchaseValue) : null,
      current_value: value,
      notes: notes.trim() || null,
    });
    setLoading(false);

    if (error) { toast.error("No se pudo crear el bien", { description: error.message }); return; }
    toast.success("Bien creado");
    router.refresh();
    router.replace("/bienes");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej. Bicicleta, Cama, Nevera..." required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Categoría</Label>
            <Select value={category} items={ASSET_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onValueChange={(v) => setCategory(v ?? "otro")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="current_value">Valor actual estimado</Label>
            <Input id="current_value" inputMode="decimal" placeholder="Ej. 500000" required value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase_value">Valor de compra (opcional)</Label>
            <Input id="purchase_value" inputMode="decimal" placeholder="Ej. 800000" value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase_date">Fecha de compra (opcional)</Label>
            <Input id="purchase_date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" placeholder="Ej. Marca, estado, ubicación..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Guardando..." : "Crear bien"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
