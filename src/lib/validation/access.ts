/** Età in anni compiuti alla data odierna. `null` se la data non è valida. */
export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  const mm = now.getMonth() + 1;
  const dd = now.getDate();
  if (mm < m || (mm === m && dd < d)) age -= 1;
  return age;
}

export function isMinor(birthDate: string | null): boolean {
  const age = ageFromBirthDate(birthDate);
  return age != null && age < 18;
}

/** Password provvisoria leggibile: 3 lettere + 3 cifre + 3 lettere. */
export function generateTempPassword(): string {
  const letters = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set: string, n: number) => {
    const buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    return Array.from(buf, (v) => set[v % set.length]).join("");
  };
  return `${pick(letters, 3)}${pick(digits, 3)}${pick(letters, 3)}`;
}
