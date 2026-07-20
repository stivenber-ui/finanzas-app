import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarBienForm } from "./editar-bien-form";

export default async function EditarBienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("id, name, category, purchase_date, purchase_value, current_value, notes, archived_at")
    .eq("id", id)
    .maybeSingle();

  if (!asset) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/bienes" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar bien</h1>
      </div>
      <EditarBienForm asset={asset} />
    </div>
  );
}
