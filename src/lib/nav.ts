import type { PermissionKey } from "@/lib/auth/permissions";

export type NavItem = {
  label: string;
  href: string;
  symbol: string;
  /** Visibile solo con questo permesso (o `organization.manage`). */
  permission?: PermissionKey;
};

export type NavGroup = { label: string; items: NavItem[] };

/** Struttura del menu. Le route non ancora implementate mostrano un segnaposto. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "GESTIONE",
    items: [
      { label: "Dashboard", href: "/dashboard", symbol: "▦" },
      { label: "Atleti", href: "/atleti", symbol: "♟", permission: "people.manage" },
      { label: "Coach", href: "/coach", symbol: "◈", permission: "people.manage" },
      { label: "Gruppi", href: "/gruppi", symbol: "◉", permission: "groups.manage" },
      { label: "Calendario", href: "/calendario", symbol: "▤", permission: "attendance.manage" },
      { label: "Presenze", href: "/presenze", symbol: "✓", permission: "attendance.manage" },
      { label: "Abbonamenti", href: "/abbonamenti", symbol: "▭", permission: "finance.manage" },
      { label: "Pagamenti", href: "/pagamenti", symbol: "€", permission: "finance.manage" },
      { label: "Tesseramenti", href: "/tesseramenti", symbol: "▦", permission: "people.manage" },
      { label: "Certificati", href: "/certificati", symbol: "✚", permission: "documents.manage" },
      { label: "Categorie", href: "/categorie", symbol: "⬡", permission: "people.manage" },
      { label: "Comunicazioni", href: "/comunicazioni", symbol: "◌", permission: "communications.manage" },
    ],
  },
  {
    label: "ANALISI",
    items: [
      { label: "Report", href: "/report", symbol: "▥", permission: "reports.read" },
      { label: "Impostazioni", href: "/impostazioni", symbol: "⚙", permission: "facilities.manage" },
    ],
  },
];
