import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Impostazioni | ATHLETIX" };

export default async function Page() {
  await requirePermission("organization.manage");
  return <ComingSoon title="Impostazioni" phase="Fase 1" />;
}
