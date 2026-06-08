import { createClient } from "@/lib/supabase/server";
import { NuevaMetaForm } from "./nueva-meta-form";

export default async function NuevaMetaPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name")
    .is("archived_at", null)
    .order("sort_order");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Nueva meta</h1>
      <NuevaMetaForm accounts={accounts ?? []} />
    </div>
  );
}
