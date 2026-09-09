import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Gruppi | ATHLETIX" };

export default async function Page() {
  await requirePermission("groups.manage");
  return <ComingSoon title="Gruppi" phase="Fase 2" />;
}
