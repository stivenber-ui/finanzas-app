import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarRecurrenteForm } from "./editar-recurrente-form";

export default async function EditarRecurrentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recurrente }, { data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("id, type, amount, account_id, to_account_id, category_id, description, frequency, next_date, end_date, active")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("accounts").select("id, name").is("archived_at", null).order("sort_order"),
    supabase.from("categories").select("id, name, kind").is("archived_at", null).order("sort_order"),
  ]);

  if (!recurrente) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/recurrentes" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar recurrente</h1>
      </div>
      <EditarRecurrenteForm recurrente={recurrente} accounts={accounts ?? []} categories={categories ?? []} />
    </div>
  );
}
