import { createClient } from "@/lib/supabase/server";
import { NuevoMovimientoForm } from "./nuevo-movimiento-form";

export default async function NuevoMovimientoPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }, { data: goals }] = await Promise.all([
    supabase.from("accounts").select("id, name, type").is("archived_at", null).order("sort_order"),
    supabase.from("categories").select("id, name, kind").is("archived_at", null).order("sort_order"),
    supabase.from("goals").select("id, name").eq("status", "activa").order("created_at"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo movimiento</h1>
      <NuevoMovimientoForm accounts={accounts ?? []} categories={categories ?? []} goals={goals ?? []} />
    </div>
  );
}
