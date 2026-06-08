import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MovimientosPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sin movimientos todavía</CardTitle>
          <CardDescription>
            Usa el botón + para registrar tu primer ingreso, gasto o transferencia.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
