"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, LayoutGrid, PiggyBank, Wallet, Plus } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: LayoutGrid },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
  { href: "/presupuesto", label: "Presupuesto", icon: PiggyBank },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {links.slice(0, 2).map((link) => (
          <NavLink key={link.href} {...link} active={isActive(pathname, link.href)} />
        ))}

        <Link
          href="/movimientos/nuevo"
          aria-label="Registrar movimiento"
          className="-translate-y-3 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </Link>

        {links.slice(2).map((link) => (
          <NavLink key={link.href} {...link} active={isActive(pathname, link.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
