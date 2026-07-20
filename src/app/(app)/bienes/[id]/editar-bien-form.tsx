"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
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

type Asset = {
  id: string;
  name: string;
  category: string;
  purchase_date: string | null;
  purchase_value: number | null;
  current_value: number;
  notes: string | null;
  archived_at: string | null;
};

const amountFormatter = new Intl.NumberFormat("es-CO");

function parseAmount(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export function EditarBienForm({ asset }: { asset: Asset }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState(asset.category);
  const [purchaseDate, setPurchaseDate] = useState(asset.purchase_date?.slice(0, 10) ?? "");
  const [purchaseValue, setPurchaseValue] = useState(asset.purchase_value != null ? amountFormatter.format(Number(asset.purchase_value)) : "");
  const [currentValue, setCurrentValue] = useState(amountFormatter.format(Number(asset.current_value)));
  const [notes, setNotes] = useState(asset.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isArchived = !!asset.archived_at;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = parseAmount(currentValue);
    if (!currentValue || isNaN(value) || value < 0) { toast.error("Ingresa un valor actual válido"); return; }

    setLoading(true);
    const { error } = await supabase
      .from("assets")
      .update({
        name: name.trim(),
        category,
        purchase_date: purchaseDate || null,
        purchase_value: purchaseValue ? parseAmount(purchaseValue) : null,
        current_value: value,
        notes: notes.trim() || null,
      })
      .eq("id", asset.id);
    setLoading(false);

    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Bien actualizado");
    router.refresh();
    router.replace("/bienes");
  }

  async function handleArchive() {
    if (!window.confirm("¿Archivar este bien? Dejará de contar en tu patrimonio pero se conserva el historial.")) return;
    setArchiving(true);
    const { error } = await supabase.from("assets").update({ archived_at: new Date().toISOString() }).eq("id", asset.id);
    setArchiving(false);
    if (error) { toast.error("No se pudo archivar", { description: error.message }); return; }
    toast.success("Bien archivado");
    router.refresh();
    router.replace("/bienes");
  }

  async function handleUnarchive() {
    setArchiving(true);
    const { error } = await supabase.from("assets").update({ archived_at: null }).eq("id", asset.id);
    setArchiving(false);
    if (error) { toast.error("No se pudo reactivar", { description: error.message }); return; }
    toast.success("Bien reactivado");
    router.refresh();
    router.replace("/bienes");
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este bien? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("assets").delete().eq("id", asset.id);
    setDeleting(false);
    if (error) { toast.error("No se pudo eliminar", { description: error.message }); return; }
    toast.success("Bien eliminado");
    router.refresh();
    router.replace("/bienes");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {isArchived && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Este bien está archivado y no cuenta en tu patrimonio.
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
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
            <Input id="current_value" inputMode="decimal" required value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase_value">Valor de compra (opcional)</Label>
            <Input id="purchase_value" inputMode="decimal" value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase_date">Fecha de compra (opcional)</Label>
            <Input id="purchase_date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" size="lg" disabled={loading || archiving || deleting}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            {isArchived ? (
              <Button type="button" variant="outline" size="lg" disabled={loading || archiving || deleting} onClick={handleUnarchive}>
                <ArchiveRestore className="size-4" />
                {archiving ? "Activando..." : "Reactivar bien"}
              </Button>
            ) : (
              <Button type="button" variant="outline" size="lg" disabled={loading || archiving || deleting} onClick={handleArchive} className="text-muted-foreground">
                <Archive className="size-4" />
                {archiving ? "Archivando..." : "Archivar bien"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={loading || archiving || deleting}
              onClick={handleDelete}
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
            >
              <Trash2 className="size-4" />
              {deleting ? "Eliminando..." : "Eliminar bien"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
