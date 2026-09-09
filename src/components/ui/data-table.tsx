import Link from "next/link";
import type { ReactNode } from "react";

export type Column<Row> = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
  className?: string;
};

export function DataTable<Row>({
  columns,
  rows,
  getKey,
  rowHref,
  empty = "Nessun elemento.",
}: {
  columns: Column<Row>[];
  rows: Row[];
  getKey: (row: Row) => string;
  rowHref?: (row: Row) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          <span className="empty-icon">◦</span>
          <p>{empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ overflowX: "auto" }}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#eef1f5] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={getKey(row)}
                className="border-b border-[#f1f4f9] last:border-0 hover:bg-[#fafbfe]"
              >
                {columns.map((c, i) => {
                  const raw = (row as Record<string, unknown>)[c.key];
                  const content: ReactNode = c.render
                    ? c.render(row)
                    : raw == null || raw === ""
                      ? "—"
                      : (raw as ReactNode);
                  return (
                    <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {href && i === 0 ? (
                        <Link
                          href={href}
                          className="font-semibold text-[var(--blue)]"
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
