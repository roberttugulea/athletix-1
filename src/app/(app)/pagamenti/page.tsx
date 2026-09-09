import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Pagamenti | ATHLETIX" };

export default async function Page() {
  await requirePermission("finance.manage");
  return <ComingSoon title="Pagamenti" phase="Fase 4" />;
}
