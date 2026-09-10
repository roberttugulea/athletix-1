import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { getPermissions, resolvePermission } from "@/lib/auth/permissions";
import { getPortalIdentity } from "@/lib/auth/portal";
import { getActiveOrg, getMemberships, requireUser } from "@/lib/auth/session";
import { NAV_GROUPS } from "@/lib/nav";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const memberships = await getMemberships();
  if (memberships.length === 0) {
    const portal = await getPortalIdentity();
    redirect(portal.isPortalUser ? "/area" : "/onboarding");
  }

  const activeOrg = await getActiveOrg();
  if (!activeOrg) redirect("/onboarding");

  const permissions = await getPermissions(activeOrg.organizationId);

  const navGroups = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) =>
        !item.permission || resolvePermission(permissions, item.permission),
    ),
  })).filter((group) => group.items.length > 0);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Utente";

  return (
    <AppShell
      user={{ name: displayName }}
      org={{ id: activeOrg.organizationId, name: activeOrg.organizationName }}
      organizations={memberships.map((m) => ({
        id: m.organizationId,
        name: m.organizationName,
      }))}
      navGroups={navGroups}
    >
      {children}
    </AppShell>
  );
}
