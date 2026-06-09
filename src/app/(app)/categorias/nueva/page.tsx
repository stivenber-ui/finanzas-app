import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NuevaCategoriaForm } from "./nueva-categoria-form";

export default function NuevaCategoriaPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/categorias" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva categoría</h1>
      </div>
      <NuevaCategoriaForm />
    </div>
  );
}
