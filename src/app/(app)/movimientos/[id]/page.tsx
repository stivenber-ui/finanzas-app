import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarMovimientoForm } from "./editar-movimiento-form";

export default async function MovimientoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tx }, { data: accounts }, { data: categories }, { data: goals }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, amount, occurred_on, notes, account_id, to_account_id, category_id, goal_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("accounts").select("id, name, type").is("archived_at", null).order("sort_order"),
    supabase.from("categories").select("id, name, kind").is("archived_at", null).order("sort_order"),
    supabase.from("goals").select("id, name").eq("status", "activa").order("created_at"),
  ]);

  if (!tx) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Editar movimiento</h1>
      <EditarMovimientoForm transaction={tx} accounts={accounts ?? []} categories={categories ?? []} goals={goals ?? []} />
    </div>
  );
}
