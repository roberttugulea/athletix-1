import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Coach | ATHLETIX" };

export default async function Page() {
  await requirePermission("people.manage");
  return <ComingSoon title="Coach" phase="Fase 2" />;
}
