import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarMetaForm } from "./editar-meta-form";

export default async function EditarMetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: goal }, { data: accounts }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, target_amount, initial_amount, target_date, account_id, status")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("accounts").select("id, name").is("archived_at", null).order("sort_order"),
  ]);

  if (!goal) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/presupuestos" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar meta</h1>
      </div>
      <EditarMetaForm goal={goal} accounts={accounts ?? []} />
    </div>
  );
}
