"use client";

import { CircleUser, House, LayoutGrid, LayoutTemplate, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", short: "Home", icon: House },
  { href: "/decks", label: "My decks", short: "Decks", icon: LayoutGrid },
  { href: "/templates", label: "Templates", short: "Templates", icon: LayoutTemplate },
  { href: "/account", label: "Account", short: "Account", icon: CircleUser },
];

/** Sidebar links on wide screens, bottom tab bar on phones. */
export function AppNav({ admin, variant }: { admin: boolean; variant: "side" | "tabs" }) {
  const pathname = usePathname();
  const items = admin ? [...ITEMS, { href: "/admin", label: "Admin", short: "Admin", icon: ShieldCheck }] : ITEMS;
  return (
    <nav className={variant === "side" ? "app-nav" : "app-tabs no-print"} aria-label="Main">
      {items.map(({ href, label, short, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
            <Icon size={variant === "side" ? 18 : 20} aria-hidden="true" />
            <span>{variant === "side" ? label : short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
