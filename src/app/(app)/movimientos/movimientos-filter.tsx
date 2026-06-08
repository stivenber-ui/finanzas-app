"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = { id: string; name: string };

export function MovimientosFilter({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete("page");
      startTransition(() => router.push(`/movimientos?${params.toString()}`));
    },
    [router, sp],
  );

  const q = sp.get("q") ?? "";
  const type = sp.get("type") ?? "";
  const accountId = sp.get("account_id") ?? "";

  const typeOptions = [
    { value: "", label: "Todos" },
    { value: "gasto", label: "Gastos" },
    { value: "ingreso", label: "Ingresos" },
    { value: "transferencia", label: "Transferencias" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nota..."
          defaultValue={q}
          className="pl-9"
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout((e.target as HTMLInputElement & { _t?: ReturnType<typeof setTimeout> })._t);
            (e.target as HTMLInputElement & { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(
              () => push({ q: val }),
              400,
            );
          }}
        />
      </div>
      <div className="flex gap-2">
        <Select value={type || "_all"} items={typeOptions.map((o) => ({ value: o.value || "_all", label: o.label }))} onValueChange={(v) => push({ type: !v || v === "_all" ? "" : v })}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((o) => (
              <SelectItem key={o.value || "_all"} value={o.value || "_all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {accounts.length > 1 && (
          <Select value={accountId || "_all"} items={[{ value: "_all", label: "Todas las cuentas" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} onValueChange={(v) => push({ account_id: !v || v === "_all" ? "" : v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas las cuentas</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
