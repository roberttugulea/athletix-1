import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Report | ATHLETIX" };

export default async function Page() {
  await requirePermission("reports.read");
  return <ComingSoon title="Report" phase="Fase 7" />;
}
