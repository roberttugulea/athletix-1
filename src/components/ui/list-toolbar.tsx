/**
 * Barra filtri server-rendered: è un semplice <form method="get">, nessun
 * JavaScript lato client. Il submit ricarica la pagina con i parametri query.
 */
export function ListToolbar({
  q,
  filters = [],
}: {
  q?: string;
  filters?: {
    name: string;
    value?: string;
    options: { value: string; label: string }[];
  }[];
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <label htmlFor="q" className="mb-1 block text-xs font-semibold">
          Cerca
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Nome, cognome, codice fiscale…"
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
        />
      </div>
      {filters.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="mb-1 block text-xs font-semibold">
            {f.name === "stato" ? "Stato" : f.name}
          </label>
          <select
            id={f.name}
            name={f.name}
            defaultValue={f.value ?? ""}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="submit"
        className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)]"
      >
        Filtra
      </button>
    </form>
  );
}
