import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NuevaRecurrenteForm } from "./nueva-recurrente-form";

export default async function NuevaRecurrentePage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("accounts").select("id, name").is("archived_at", null).order("sort_order"),
    supabase.from("categories").select("id, name, kind").is("archived_at", null).order("sort_order"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/recurrentes" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva recurrente</h1>
      </div>
      <NuevaRecurrenteForm accounts={accounts ?? []} categories={categories ?? []} />
    </div>
  );
}
