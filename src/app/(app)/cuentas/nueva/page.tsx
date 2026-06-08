import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NuevaCuentaForm } from "./nueva-cuenta-form";

export default function NuevaCuentaPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/cuentas" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva cuenta</h1>
      </div>
      <NuevaCuentaForm />
    </div>
  );
}
