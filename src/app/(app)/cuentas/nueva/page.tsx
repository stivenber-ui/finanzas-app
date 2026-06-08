import { NuevaCuentaForm } from "./nueva-cuenta-form";

export default function NuevaCuentaPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Nueva cuenta</h1>
      <NuevaCuentaForm />
    </div>
  );
}
