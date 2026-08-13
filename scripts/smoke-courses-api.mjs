/**
 * Smoke test Gate 1 courses API against local stack.
 * Requires: postgres seeded + API on :4000
 */
const API = process.env.EDUVY_API_URL ?? "http://localhost:4000/api/v1";
const BFF = process.env.EDUVY_BFF_SECRET ?? process.env.BFF_SHARED_SECRET;

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-eduvy-bff-secret": BFF,
    },
    body: JSON.stringify({
      email: "owner@horizonte.demo",
      password: "Eduvy@2026!",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  const login = await loginRes.json();
  const token = login.accessToken;

  const tenantsRes = await fetch(`${API}/tenants/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!tenantsRes.ok) {
    throw new Error(`tenants failed: ${tenantsRes.status}`);
  }
  const tenants = await tenantsRes.json();
  const tenantId = tenants[0]?.id;
  if (!tenantId) throw new Error("no tenant");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-eduvy-tenant-id": tenantId,
  };

  const createRes = await fetch(`${API}/courses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "React para Iniciantes",
      shortDescription: "Fundamentos práticos de React",
      category: "Tecnologia",
      workloadMinutes: 720,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`);
  }
  const course = await createRes.json();
  console.log("created", course.id, course.status, course.currentVersion?.version);

  const publishRes = await fetch(`${API}/courses/${course.id}/publish`, {
    method: "POST",
    headers,
  });
  if (!publishRes.ok) {
    throw new Error(`publish failed: ${publishRes.status} ${await publishRes.text()}`);
  }
  const published = await publishRes.json();
  console.log("published", published.status, published.currentVersion?.status);

  const listRes = await fetch(`${API}/courses?status=PUBLISHED`, { headers });
  if (!listRes.ok) {
    throw new Error(`list failed: ${listRes.status}`);
  }
  const list = await listRes.json();
  console.log("list_total", list.meta.total);

  const otherTenant = tenants[1]?.id;
  if (otherTenant) {
    const cross = await fetch(`${API}/courses/${course.id}`, {
      headers: { ...headers, "x-eduvy-tenant-id": otherTenant },
    });
    if (cross.status !== 404) {
      throw new Error(`cross-tenant leak: ${cross.status}`);
    }
    console.log("cross_tenant_blocked", cross.status);
  }

  console.log("PASS: courses API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
