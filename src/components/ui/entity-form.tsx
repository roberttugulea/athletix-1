"use client";

import { useActionState } from "react";

import { FormMessage, SubmitButton } from "@/components/ui/form";
import type { FormState } from "@/lib/forms";

export type FieldConfig = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "time"
    | "datetime-local"
    | "month"
    | "number"
    | "select"
    | "checkbox"
    | "color";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  help?: string;
  width?: "full" | "half";
};

export function EntityForm({
  action,
  fields,
  defaults = {},
  hidden = {},
  submitLabel = "Salva",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldConfig[];
  defaults?: Record<string, unknown>;
  hidden?: Record<string, string>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="panel" style={{ padding: 20 }}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const def = defaults[f.name];
          const errors = state?.fieldErrors?.[f.name];
          const cls = f.width === "full" ? "sm:col-span-2" : "";
          return (
            <div key={f.name} className={cls}>
              {f.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name={f.name}
                    defaultChecked={Boolean(def)}
                    value="on"
                  />
                  {f.label}
                </label>
              ) : (
                <>
                  <label
                    htmlFor={f.name}
                    className="mb-1 block text-xs font-semibold"
                  >
                    {f.label}
                    {f.required ? " *" : ""}
                  </label>
                  {f.type === "select" ? (
                    <select
                      id={f.name}
                      name={f.name}
                      required={f.required}
                      defaultValue={def == null ? "" : String(def)}
                      className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
                    >
                      <option value="">—</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={f.name}
                      name={f.name}
                      type={f.type ?? "text"}
                      required={f.required}
                      placeholder={f.placeholder}
                      step={f.type === "number" ? "any" : undefined}
                      defaultValue={def == null ? "" : String(def)}
                      className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
                    />
                  )}
                </>
              )}
              {f.help ? (
                <p className="mt-1 text-[11px] text-[var(--muted)]">{f.help}</p>
              ) : null}
              {errors?.map((e) => (
                <p key={e} className="mt-1 text-xs text-red-600">
                  {e}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      {state?.message ? (
        <div className="mt-4">
          <FormMessage tone={state.ok ? "success" : "error"}>
            {state.message}
          </FormMessage>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <div className="w-40">
          <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
