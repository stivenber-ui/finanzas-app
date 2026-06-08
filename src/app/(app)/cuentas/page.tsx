import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CuentasPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sin cuentas registradas</CardTitle>
          <CardDescription>
            Aquí verás tus cuentas bancarias, efectivo, tarjetas de crédito e inversiones.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
