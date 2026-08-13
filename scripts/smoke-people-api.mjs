/**
 * Smoke test Gate 3 people API against local stack.
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
  if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status}`);

  const login = await loginRes.json();
  const token = login.accessToken;

  const tenantsRes = await fetch(`${API}/tenants/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tenants = await tenantsRes.json();
  const tenantId = tenants[0]?.id;
  if (!tenantId) throw new Error("no tenant");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-eduvy-tenant-id": tenantId,
  };

  const studentsRes = await fetch(`${API}/students`, { headers });
  if (!studentsRes.ok) {
    throw new Error(`students list failed: ${studentsRes.status} ${await studentsRes.text()}`);
  }
  const students = await studentsRes.json();
  console.log("students_total", students.meta.total);

  const instructorsRes = await fetch(`${API}/instructors`, { headers });
  if (!instructorsRes.ok) {
    throw new Error(`instructors list failed: ${instructorsRes.status}`);
  }
  const instructors = await instructorsRes.json();
  console.log("instructors_total", instructors.meta.total);

  const inviteRes = await fetch(`${API}/students/invite`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: `novo.aluno.${Date.now()}@demo.test` }),
  });
  if (!inviteRes.ok) {
    throw new Error(`invite failed: ${inviteRes.status} ${await inviteRes.text()}`);
  }
  const invite = await inviteRes.json();
  console.log("invite_created", invite.invitation?.id);

  console.log("PASS: people API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
