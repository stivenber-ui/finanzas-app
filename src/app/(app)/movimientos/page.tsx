import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Tag, Download, Inbox, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { MovimientosFilter } from "./movimientos-filter";

const PAGE_SIZE = 30;

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateHeaderFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDateHeader(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  const label = dateHeaderFormatter.format(new Date(year, month - 1, day));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type Linked = { name: string } | { name: string }[] | null;

type RawTx = {
  id: string;
  type: "ingreso" | "gasto" | "transferencia";
  amount: number;
  occurred_on: string;
  notes: string | null;
  account: Linked;
  to_account: Linked;
  category: Linked;
};

type Tx = Omit<RawTx, "account" | "to_account" | "category"> & {
  account: { name: string } | null;
  to_account: { name: string } | null;
  category: { name: string } | null;
};

function one(value: Linked): { name: string } | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalize(tx: RawTx): Tx {
  return { ...tx, account: one(tx.account), to_account: one(tx.to_account), category: one(tx.category) };
}

function buildExportUrl(type: string, accountId: string, q: string, dateFrom: string, dateTo: string) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (accountId) params.set("account_id", accountId);
  if (q) params.set("q", q);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString();
  return qs ? `/api/export?${qs}` : "/api/export";
}

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const accountId = typeof params.account_id === "string" ? params.account_id : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const dateFrom = typeof params.date_from === "string" ? params.date_from : "";
  const dateTo = typeof params.date_to === "string" ? params.date_to : "";

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ data: accounts }] = await Promise.all([
    supabase.from("accounts").select("id, name").is("archived_at", null).order("sort_order"),
  ]);

  let query = supabase
    .from("transactions")
    .select(
      "id, type, amount, occurred_on, notes, account:accounts!transactions_account_id_fkey(name), to_account:accounts!transactions_to_account_id_fkey(name), category:categories(name)",
      { count: "exact" },
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (typeFilter) query = query.eq("type", typeFilter as "ingreso" | "gasto" | "transferencia");
  if (accountId) query = query.or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);
  if (q) query = query.ilike("notes", `%${q}%`);
  if (dateFrom) query = query.gte("occurred_on", dateFrom);
  if (dateTo) query = query.lte("occurred_on", dateTo);

  const { data, count } = await query;

  const transactions = (data ?? []).map(normalize);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const groups: { date: string; items: Tx[] }[] = [];
  for (const tx of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.occurred_on) last.items.push(tx);
    else groups.push({ date: tx.occurred_on, items: [tx] });
  }

  const hasFilters = !!(typeFilter || accountId || q || dateFrom || dateTo);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
        <div className="flex items-center gap-1">
          {!!count && (
            <span className="text-sm text-muted-foreground">
              {count} {hasFilters ? (count === 1 ? "resultado" : "resultados") : "en total"}
            </span>
          )}
          <Button render={<Link href={buildExportUrl(typeFilter, accountId, q, dateFrom, dateTo)} />} size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="Descargar CSV" title="Descargar CSV">
            <Download className="size-4" />
          </Button>
          <Button render={<Link href="/categorias" />} size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="Gestionar categorías" title="Gestionar categorías">
            <Tag className="size-4" />
          </Button>
        </div>
      </div>

      <Suspense>
        <MovimientosFilter accounts={accounts ?? []} />
      </Suspense>

      {!transactions.length && (
        <Card>
          <CardContent>
            <EmptyState
              icon={hasFilters ? SearchX : Inbox}
              title={hasFilters ? "Sin resultados" : "Aún no hay movimientos"}
              description={hasFilters ? "Ningún movimiento coincide con los filtros." : "Registra el primero con el botón + de abajo."}
            />
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">{formatDateHeader(group.date)}</h2>
          <Card className="overflow-hidden py-0">
            <CardContent className="flex flex-col divide-y divide-border px-0">
              {group.items.map((tx) => (
                <MovimientoRow key={tx.id} tx={tx} />
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pb-2">
          {page > 1 ? (
            <Button render={<Link href={pageHref(page - 1, typeFilter, accountId, q, dateFrom, dateTo)} />} variant="outline" size="sm">
              Anterior
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>Anterior</Button>
          )}
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          {page < totalPages ? (
            <Button render={<Link href={pageHref(page + 1, typeFilter, accountId, q, dateFrom, dateTo)} />} variant="outline" size="sm">
              Siguiente
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>Siguiente</Button>
          )}
        </div>
      )}
    </div>
  );
}

function pageHref(p: number, type: string, accountId: string, q: string, dateFrom: string, dateTo: string) {
  const params = new URLSearchParams();
  if (p > 1) params.set("page", String(p));
  if (type) params.set("type", type);
  if (accountId) params.set("account_id", accountId);
  if (q) params.set("q", q);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString();
  return qs ? `/movimientos?${qs}` : "/movimientos";
}

function MovimientoRow({ tx }: { tx: Tx }) {
  const Icon = tx.type === "ingreso" ? ArrowUpRight : tx.type === "gasto" ? ArrowDownRight : ArrowLeftRight;
  const chip = tx.type === "ingreso" ? "bg-positive/10 text-positive" : tx.type === "gasto" ? "bg-negative/10 text-negative" : "bg-muted text-muted-foreground";
  const amountColor = tx.type === "ingreso" ? "text-positive" : tx.type === "gasto" ? "text-foreground" : "text-muted-foreground";
  const sign = tx.type === "ingreso" ? "+" : tx.type === "gasto" ? "−" : "";

  const subtitle =
    tx.type === "transferencia"
      ? `${tx.account?.name ?? "?"} → ${tx.to_account?.name ?? "?"}`
      : [tx.category?.name, tx.account?.name].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/movimientos/${tx.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/60"
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{tx.notes || tx.category?.name || "Movimiento"}</span>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold", amountColor)}>
        {sign}
        {currency.format(tx.amount)}
      </span>
    </Link>
  );
}
