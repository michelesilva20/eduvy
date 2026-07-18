import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AUTH_COOKIES } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { AppShell } from "@/components/platform/shell/app-shell";
import { getSession } from "@/lib/auth/session";
import { getTenantContext } from "@/lib/tenancy/context";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const tenantContext = await getTenantContext(accessToken);

  return (
    <AppShell user={session.user} tenantContext={tenantContext}>
      {children}
    </AppShell>
  );
}
