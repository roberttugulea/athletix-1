const TZ = "Europe/Rome";

const timeFmt = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const dayFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});

const shortDateFmt = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatShortDate = (iso: string) =>
  shortDateFmt.format(new Date(iso));

/** Chiave giorno YYYY-MM-DD nel fuso Europe/Rome. */
export function dayKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
  return parts;
}

/** Lunedì della settimana che contiene `date` (YYYY-MM-DD). */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const dow = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Quanto il fuso `tz` è avanti rispetto a UTC (ms) per l'istante UTC indicato.
 * Indipendente dal fuso della macchina.
 */
function tzAheadOfUtcMs(utcMs: number, tz: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  const asTz = Date.UTC(
    g("year"),
    g("month") - 1,
    g("day"),
    g("hour") % 24,
    g("minute"),
    g("second"),
  );
  return asTz - utcMs;
}

/**
 * Converte un valore `<input type="datetime-local">` ("2026-11-01T15:30"),
 * inteso come ora di parete nel fuso `tz`, nell'ISO UTC corrispondente.
 */
export function localInputToUtcISO(local: string, tz = TZ): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return local;
  const [y, mo, da, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const offset = tzAheadOfUtcMs(guess, tz);
  return new Date(guess - offset).toISOString();
}

/** ISO UTC → valore per `<input type="datetime-local">` nel fuso `tz`. */
export function utcISOToLocalInput(iso: string, tz = TZ): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return parts.replace(" ", "T");
}
