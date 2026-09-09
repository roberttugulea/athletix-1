import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Atleti | ATHLETIX" };

export default async function Page() {
  await requirePermission("people.manage");
  return <ComingSoon title="Atleti" phase="Fase 2" />;
}
