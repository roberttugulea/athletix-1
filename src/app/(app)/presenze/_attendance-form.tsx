"use client";

import { useActionState } from "react";

import { FormMessage, SubmitButton } from "@/components/ui/form";
import {
  ATTENDANCE_LABEL,
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "@/lib/validation/attendance";
import { saveAttendance } from "@/server/actions/attendance";

export type AthleteAttendance = {
  athleteId: string;
  name: string;
  current: AttendanceStatus | null;
};

export function AttendanceForm({
  sessionId,
  athletes,
}: {
  sessionId: string;
  athletes: AthleteAttendance[];
}) {
  const [state, action, pending] = useActionState(saveAttendance, undefined);

  return (
    <form action={action} className="panel" style={{ padding: 0 }}>
      <input type="hidden" name="session_id" value={sessionId} />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#eef1f5] text-left">
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Atleta
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Presenza
            </th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((a) => (
            <tr
              key={a.athleteId}
              className="border-b border-[#f1f4f9] last:border-0"
            >
              <td className="px-4 py-3 font-semibold">{a.name}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  {ATTENDANCE_STATUSES.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <input
                        type="radio"
                        name={`att_${a.athleteId}`}
                        value={s}
                        defaultChecked={a.current === s}
                      />
                      {ATTENDANCE_LABEL[s]}
                    </label>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-4 p-4">
        {state?.message ? (
          <FormMessage tone={state.ok ? "success" : "error"}>
            {state.message}
          </FormMessage>
        ) : (
          <span />
        )}
        <div className="w-44">
          <SubmitButton pending={pending}>Salva presenze</SubmitButton>
        </div>
      </div>
    </form>
  );
}
