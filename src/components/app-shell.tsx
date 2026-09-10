"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { NavGroup } from "@/lib/nav";
import { signOut } from "@/server/actions/auth";
import { switchOrganization } from "@/server/actions/organization";

type OrgRef = { id: string; name: string };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase() || "AT";
}

export function AppShell({
  user,
  org,
  organizations,
  navGroups,
  children,
}: {
  user: { name: string };
  org: OrgRef;
  organizations: OrgRef[];
  navGroups: NavGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);

  return (
    <main className="app-shell">
      {menuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Chiudi menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand">
          <b>A</b>
          <span>ATHLETIX</span>
        </div>

        <div className="workspace" style={{ position: "relative" }}>
          <i />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {org.name}
          </span>
          {organizations.length > 1 && (
            <button
              type="button"
              aria-label="Cambia organizzazione"
              onClick={() => setOrgPickerOpen((v) => !v)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: 0,
                color: "#9ca9c0",
                fontSize: 16,
              }}
            >
              ⌄
            </button>
          )}
          {orgPickerOpen && organizations.length > 1 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "#1f2f4d",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 9,
                padding: 6,
                zIndex: 30,
              }}
            >
              {organizations.map((o) => (
                <form key={o.id} action={switchOrganization.bind(null, o.id)}>
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background:
                        o.id === org.id ? "rgba(255,255,255,.08)" : "transparent",
                      border: 0,
                      color: "#eef3ff",
                      padding: "8px 9px",
                      borderRadius: 7,
                      fontSize: 12,
                    }}
                  >
                    {o.name}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>

        <nav aria-label="Navigazione principale">
          {navGroups.map((group, gi) => (
            <div key={group.label}>
              <p className={`nav-label ${gi > 0 ? "secondary" : ""}`}>
                {group.label}
              </p>
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "active" : ""}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 11px",
                      borderRadius: 8,
                      fontSize: 13,
                      marginBottom: 2,
                      color: active ? "#fff" : "#b5c0d2",
                      background: active ? "#315de0" : "transparent",
                      fontWeight: active ? 700 : 400,
                    }}
                  >
                    <span className="nav-symbol">{item.symbol}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="account">
          <span className="avatar">{initials(user.name)}</span>
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </strong>
            <small>{org.name}</small>
          </div>
          <form action={signOut} style={{ marginLeft: "auto" }}>
            <button
              type="submit"
              aria-label="Esci"
              style={{
                background: "transparent",
                border: 0,
                color: "#91a0b7",
                fontSize: 12,
              }}
            >
              Esci
            </button>
          </form>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Apri menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <span className="mobile-brand">ATHLETIX</span>
          <div className="top-actions">
            <form action="/cerca" method="get">
              <input
                name="q"
                placeholder="Cerca atleti, gruppi, gare…"
                aria-label="Ricerca globale"
                className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--blue)]"
                style={{ width: 220 }}
              />
            </form>
            <span className="avatar">{initials(user.name)}</span>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
