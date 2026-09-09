import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string } | ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow.toUpperCase()}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {action && typeof action === "object" && "href" in action ? (
        <Link href={action.href} className="primary-button">
          <span>＋</span>
          <span className="desktop-label">{action.label}</span>
        </Link>
      ) : (
        action
      )}
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav className="mb-4 text-xs text-[var(--muted)]">
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`}>
          {i > 0 ? <span className="mx-1.5">/</span> : null}
          {it.href ? (
            <Link href={it.href} className="text-[var(--blue)]">
              {it.label}
            </Link>
          ) : (
            it.label
          )}
        </span>
      ))}
    </nav>
  );
}
