import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label: string;
  name: string;
  errors?: string[];
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, name, errors, type = "text", ...rest }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--blue)]"
        {...rest}
      />
      {errors?.map((error) => (
        <p key={error} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ))}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#275adc] disabled:opacity-60"
    >
      {pending ? "Attendere…" : children}
    </button>
  );
}

export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      className={
        tone === "error"
          ? "text-xs text-red-600"
          : "rounded-lg bg-[#e7f8f0] px-3 py-2 text-xs text-[#1f7a5a]"
      }
    >
      {children}
    </p>
  );
}
