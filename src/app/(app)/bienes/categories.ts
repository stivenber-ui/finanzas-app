import { Armchair, Refrigerator, Laptop, Car, Shirt, Package, type LucideIcon } from "lucide-react";

export const ASSET_CATEGORIES = [
  { value: "mueble", label: "Mueble" },
  { value: "electrodomestico", label: "Electrodoméstico" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "vehiculo", label: "Vehículo" },
  { value: "ropa_accesorios", label: "Ropa y accesorios" },
  { value: "otro", label: "Otro" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  ASSET_CATEGORIES.map((c) => [c.value, c.label]),
);

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  mueble: Armchair,
  electrodomestico: Refrigerator,
  tecnologia: Laptop,
  vehiculo: Car,
  ropa_accesorios: Shirt,
  otro: Package,
};
