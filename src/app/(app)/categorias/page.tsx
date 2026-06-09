import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, kind, sort_order, archived_at")
    .order("kind")
    .order("sort_order");

  const all = categories ?? [];
  const gastos = all.filter((c) => c.kind === "gasto" && !c.archived_at);
  const ingresos = all.filter((c) => c.kind === "ingreso" && !c.archived_at);
  const archivadas = all.filter((c) => !!c.archived_at);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <Button render={<Link href="/categorias/nueva" />} size="sm" variant="outline">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <Section title="Gastos" items={gastos} />
      <Section title="Ingresos" items={ingresos} />

      {archivadas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Archivadas</p>
          <div className="flex flex-col gap-2">
            {archivadas.map((c) => (
              <CategoryRow key={c.id} category={c} muted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Cat = { id: string; name: string; kind: string; sort_order: number; archived_at: string | null };

function Section({ title, items }: { title: string; items: Cat[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ category, muted = false }: { category: Cat; muted?: boolean }) {
  return (
    <Link href={`/categorias/${category.id}`}>
      <Card className={cn("transition-colors active:bg-muted/60", muted && "opacity-60")}>
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <Badge variant={category.kind === "gasto" ? "destructive" : "default"} className="shrink-0 font-normal">
            {category.kind === "gasto" ? "Gasto" : "Ingreso"}
          </Badge>
          <span className="flex-1 truncate text-sm font-medium">{category.name}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
