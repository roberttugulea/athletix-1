export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "justified",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Presente",
  absent: "Assente",
  late: "In ritardo",
  justified: "Giustificato",
};

export function isAttendanceStatus(v: unknown): v is AttendanceStatus {
  return (
    typeof v === "string" &&
    (ATTENDANCE_STATUSES as readonly string[]).includes(v)
  );
}
