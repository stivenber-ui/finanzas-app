import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarCuentaForm } from "./editar-cuenta-form";

export default async function EditarCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, type, institution, initial_balance, credit_limit, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (!account) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Editar cuenta</h1>
      <EditarCuentaForm account={account} />
    </div>
  );
}
