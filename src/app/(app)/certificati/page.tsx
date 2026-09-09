import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Certificati | ATHLETIX" };

export default async function Page() {
  await requirePermission("documents.manage");
  return <ComingSoon title="Certificati" phase="Fase 5" />;
}
