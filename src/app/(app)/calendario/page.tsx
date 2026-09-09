import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Calendario | ATHLETIX" };

export default async function Page() {
  await requirePermission("attendance.manage");
  return <ComingSoon title="Calendario" phase="Fase 3" />;
}
