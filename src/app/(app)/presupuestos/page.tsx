import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PresupuestosPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Presupuestos y metas</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sin presupuestos ni metas todavía</CardTitle>
          <CardDescription>
            Define cuánto quieres gastar por categoría o ahorrar para tus objetivos.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
