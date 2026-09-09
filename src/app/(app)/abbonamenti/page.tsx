import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Abbonamenti | ATHLETIX" };

export default async function Page() {
  await requirePermission("finance.manage");
  return <ComingSoon title="Abbonamenti" phase="Fase 4" />;
}
