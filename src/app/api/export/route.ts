import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escape(v: string | null | undefined): string {
  if (!v) return "";
  if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const typeFilter = sp.get("type") ?? "";
  const accountId = sp.get("account_id") ?? "";
  const q = sp.get("q") ?? "";
  const dateFrom = sp.get("date_from") ?? "";
  const dateTo = sp.get("date_to") ?? "";

  let query = supabase
    .from("transactions")
    .select("id, type, amount, occurred_on, notes, account:accounts!transactions_account_id_fkey(name), to_account:accounts!transactions_to_account_id_fkey(name), category:categories(name)")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5000);

  if (typeFilter) query = query.eq("type", typeFilter as "ingreso" | "gasto" | "transferencia");
  if (accountId) query = query.or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);
  if (q) query = query.ilike("notes", `%${q}%`);
  if (dateFrom) query = query.gte("occurred_on", dateFrom);
  if (dateTo) query = query.lte("occurred_on", dateTo);

  const { data, error } = await query;
  if (error) return new NextResponse("Error fetching data", { status: 500 });

  const rows = (data ?? []).map((tx) => {
    const account = Array.isArray(tx.account) ? tx.account[0] : tx.account;
    const toAccount = Array.isArray(tx.to_account) ? tx.to_account[0] : tx.to_account;
    const category = Array.isArray(tx.category) ? tx.category[0] : tx.category;
    return [
      escape(tx.occurred_on?.slice(0, 10)),
      escape(tx.type),
      String(tx.amount),
      escape((account as { name: string } | null)?.name),
      escape((toAccount as { name: string } | null)?.name),
      escape((category as { name: string } | null)?.name),
      escape(tx.notes),
    ].join(",");
  });

  const csv = ["Fecha,Tipo,Monto,Cuenta,Cuenta destino,Categoría,Nota", ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movimientos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
