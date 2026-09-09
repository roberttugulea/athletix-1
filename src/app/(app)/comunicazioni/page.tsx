import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Comunicazioni | ATHLETIX" };

export default async function Page() {
  await requirePermission("communications.manage");
  return <ComingSoon title="Comunicazioni" phase="Fase 7" />;
}
