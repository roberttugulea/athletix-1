/** Serializza righe in CSV (RFC 4180), separatore `;` per compatibilità Excel IT. */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): string {
  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(";");
  const body = rows
    .map((r) => columns.map((c) => esc(r[c.key])).join(";"))
    .join("\r\n");
  // BOM per far riconoscere l'UTF-8 a Excel.
  return `﻿${head}\r\n${body}\r\n`;
}
