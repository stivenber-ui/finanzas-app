"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Category = {
  id: string;
  name: string;
  kind: string;
  sort_order: number;
  archived_at: string | null;
};

export function EditarCategoriaForm({ category }: { category: Category }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isArchived = !!category.archived_at;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("categories")
      .update({ name: name.trim() })
      .eq("id", category.id);
    setLoading(false);

    if (error) { toast.error("No se pudo guardar", { description: error.message }); return; }
    toast.success("Categoría actualizada");
    router.refresh();
    router.replace("/categorias");
  }

  async function handleArchive() {
    if (!window.confirm("¿Archivar esta categoría? Los movimientos existentes no se verán afectados.")) return;
    setArchiving(true);
    const { error } = await supabase.from("categories").update({ archived_at: new Date().toISOString() }).eq("id", category.id);
    setArchiving(false);
    if (error) { toast.error("No se pudo archivar", { description: error.message }); return; }
    toast.success("Categoría archivada");
    router.refresh();
    router.replace("/categorias");
  }

  async function handleUnarchive() {
    setArchiving(true);
    const { error } = await supabase.from("categories").update({ archived_at: null }).eq("id", category.id);
    setArchiving(false);
    if (error) { toast.error("No se pudo activar", { description: error.message }); return; }
    toast.success("Categoría reactivada");
    router.refresh();
    router.replace("/categorias");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {isArchived && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Esta categoría está archivada y no aparece en los formularios.
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Badge variant={category.kind === "gasto" ? "destructive" : "default"} className="w-fit font-normal">
              {category.kind === "gasto" ? "Gasto" : "Ingreso"}
            </Badge>
            <p className="text-xs text-muted-foreground">El tipo no puede cambiarse una vez creada la categoría.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" size="lg" disabled={loading || archiving}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            {isArchived ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={loading || archiving}
                onClick={handleUnarchive}
              >
                <ArchiveRestore className="size-4" />
                {archiving ? "Activando..." : "Activar categoría"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={loading || archiving}
                onClick={handleArchive}
                className="text-muted-foreground"
              >
                <Archive className="size-4" />
                {archiving ? "Archivando..." : "Archivar categoría"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
