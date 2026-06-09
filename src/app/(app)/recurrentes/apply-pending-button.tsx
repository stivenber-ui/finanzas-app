"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

function nextDateForFrequency(currentDate: string, frequency: string): string {
  const date = new Date(currentDate + "T12:00:00");
  switch (frequency) {
    case "semanal":     date.setDate(date.getDate() + 7); break;
    case "mensual":     date.setMonth(date.getMonth() + 1); break;
    case "bimestral":   date.setMonth(date.getMonth() + 2); break;
    case "trimestral":  date.setMonth(date.getMonth() + 3); break;
    case "semestral":   date.setMonth(date.getMonth() + 6); break;
    case "anual":       date.setFullYear(date.getFullYear() + 1); break;
  }
  return date.toISOString().slice(0, 10);
}

export function ApplyPendingButton({ pending }: { pending: string[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function applyAll() {
    setLoading(true);
    const { data: recurrentes } = await supabase
      .from("recurring_transactions")
      .select("id, type, amount, account_id, to_account_id, category_id, goal_id, description, frequency, next_date, end_date")
      .in("id", pending);

    if (!recurrentes?.length) { setLoading(false); return; }

    const inserts = recurrentes.map((r) => ({
      type: r.type,
      amount: r.amount,
      account_id: r.account_id,
      to_account_id: r.to_account_id,
      category_id: r.category_id,
      goal_id: r.goal_id,
      notes: r.description,
      occurred_on: r.next_date,
    }));

    const { error: insertErr } = await supabase.from("transactions").insert(inserts);
    if (insertErr) {
      toast.error("No se pudieron registrar los movimientos", { description: insertErr.message });
      setLoading(false);
      return;
    }

    // Advance next_date for each recurring
    await Promise.all(
      recurrentes.map((r) => {
        const next = nextDateForFrequency(r.next_date, r.frequency);
        const deactivate = r.end_date && next > r.end_date;
        return supabase
          .from("recurring_transactions")
          .update({ next_date: next, active: !deactivate })
          .eq("id", r.id);
      }),
    );

    setLoading(false);
    toast.success(`${recurrentes.length} movimiento${recurrentes.length > 1 ? "s" : ""} registrado${recurrentes.length > 1 ? "s" : ""}`);
    router.refresh();
  }

  return (
    <Button size="sm" className="mt-3 w-full" onClick={applyAll} disabled={loading}>
      <CheckCheck className="size-4" />
      {loading ? "Registrando..." : "Registrar todos"}
    </Button>
  );
}
