# Design System — Finanzas

Referencia rápida del sistema visual. Los tokens viven en `src/app/globals.css`; ningún componente debe usar colores hex sueltos.

## Color

Paleta base neutra con un único acento: **esmeralda profundo**. El color comunica significado, no decoración.

| Token | Uso |
|---|---|
| `--primary` (+ escala `--primary-50…900`) | Acento de marca: FAB, botones, navegación activa, anillos de progreso |
| `--positive` / `--negative` | Semántica financiera: ingresos / gastos, superávit / déficit, deudas |
| `--success` / `--warning` / `--destructive` | Estados: meta cumplida, presupuesto al límite, acciones destructivas |
| `--chart-1…8` | Series categóricas en gráficos y barras de categorías |
| `--background`, `--card`, `--popover` | Capas de superficie (en dark mode crean profundidad: 0.135 → 0.178 → 0.205) |

Reglas:
- Los gastos se muestran en color **neutro**; el rojo (`--negative`) se reserva para alertas reales (deuda, exceso de presupuesto, déficit) y para el tinte de iconos.
- Los ingresos usan `--positive`.
- En SVG/estilos inline usar `var(--token)` directamente — nunca `hsl(var(--token))` (los tokens son valores oklch completos).

## Tipografía

- **Geist Sans** (`--font-sans`) en toda la app; Geist Mono disponible en `--font-mono`.
- `font-variant-numeric: tabular-nums` global: las cifras siempre alinean.
- Ramp: hero KPI `text-4xl font-semibold tracking-tight` → título de página `text-2xl font-semibold tracking-tight` → título de card `text-base font-medium` → cuerpo `text-sm` → soporte `text-xs text-muted-foreground`.

## Espaciado y radios

- Espaciado en múltiplos de 4 px (escala de Tailwind). Secciones de página: `gap-4`; interior de cards: `gap-3`.
- Radio base `--radius: 0.75rem`; cards `rounded-xl`, chips y pills `rounded-full`.

## Sombras

| Token | Uso |
|---|---|
| `shadow-card` | Cards en modo claro (en oscuro se desactiva; la profundidad la dan las capas) |
| `shadow-raised` | Elementos flotantes (tooltips, popovers) |
| `shadow-fab` | FAB y marca (lleva tinte del acento) |

## Targets táctiles

Mínimos para uso con una mano en iPhone: botones `h-10` (default) / `h-12` (lg), inputs y selects `h-11`, FAB `size-14`. Botones de solo icono siempre con `aria-label`.

## Motion

- Entradas de página: utilidades CSS de `tw-animate-css` (`animate-in fade-in-0 slide-in-from-bottom-3 duration-500`) con stagger de ~60 ms vía `[animation-delay:…] [animation-fill-mode:backwards]`. No dependen de hidratación.
- Cifras: `<CountUp />` (`src/components/count-up.tsx`, usa `motion`).
- Todo respeta `prefers-reduced-motion` (override global en `globals.css` + chequeo en CountUp).
- Feedback táctil: `active:scale-[0.97…0.99]` en tarjetas clicables; nada de animaciones decorativas en loops.
