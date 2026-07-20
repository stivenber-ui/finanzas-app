import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CATEGORY_ICON, CATEGORY_LABEL } from "./categories";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function BienesPage() {
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("id, name, category, current_value, archived_at")
    .order("created_at", { ascending: false });

  const activeRows = (assets ?? []).filter((a) => !a.archived_at);
  const archivedRows = (assets ?? []).filter((a) => !!a.archived_at);
  const totalValue = activeRows.reduce((sum, a) => sum + Number(a.current_value), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Bienes</h1>
        <Button render={<Link href="/bienes/nueva" />} size="sm" variant="outline">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <span className="text-sm text-muted-foreground">Valor total en bienes</span>
          <span className="text-xl font-semibold">{currency.format(totalValue)}</span>
        </CardContent>
      </Card>

      {!activeRows.length && (
        <Card>
          <CardContent>
            <EmptyState
              icon={Package}
              title="Aún no tienes bienes registrados"
              description='Crea el primero con el botón "Nueva".'
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {activeRows.map((asset) => (
          <AssetRow key={asset.id} asset={asset} />
        ))}
      </div>

      {archivedRows.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Archivados
          </p>
          {archivedRows.map((asset) => (
            <AssetRow key={asset.id} asset={asset} muted />
          ))}
        </div>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        El valor de cada bien es un estimado que tú defines — actualízalo cuando cambie. No se calcula depreciación automática.
      </p>
    </div>
  );
}

type AssetRow = { id: string; name: string; category: string; current_value: number; archived_at: string | null };

function AssetRow({ asset, muted = false }: { asset: AssetRow; muted?: boolean }) {
  const Icon = CATEGORY_ICON[asset.category] ?? Package;
  return (
    <Link href={`/bienes/${asset.id}`}>
      <Card className={muted ? "opacity-60 transition-colors active:bg-muted/60" : "transition-colors active:bg-muted/60"}>
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{asset.name}</span>
            <span className="truncate text-xs text-muted-foreground">{CATEGORY_LABEL[asset.category] ?? asset.category}</span>
          </div>
          <span className="shrink-0 text-base font-semibold">{currency.format(Number(asset.current_value))}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
