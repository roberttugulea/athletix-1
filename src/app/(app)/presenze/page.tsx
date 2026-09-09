import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Presenze | ATHLETIX" };

export default async function Page() {
  await requirePermission("attendance.manage");
  return <ComingSoon title="Presenze" phase="Fase 3" />;
}
