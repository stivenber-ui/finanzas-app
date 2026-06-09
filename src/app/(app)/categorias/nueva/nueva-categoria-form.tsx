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

const KIND_OPTIONS = [
  { value: "gasto", label: "Gasto" },
  { value: "ingreso", label: "Ingreso" },
];

export function NuevaCategoriaForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!kind) { toast.error("Selecciona el tipo de categoría"); return; }

    setLoading(true);
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      kind,
    });
    setLoading(false);

    if (error) { toast.error("No se pudo crear la categoría", { description: error.message }); return; }
    toast.success("Categoría creada");
    router.refresh();
    router.replace("/categorias");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej. Restaurantes" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select
              value={kind}
              items={KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              onValueChange={(v) => setKind(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gasto o Ingreso" />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Guardando..." : "Crear categoría"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
