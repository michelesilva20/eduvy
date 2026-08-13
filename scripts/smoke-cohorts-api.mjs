/**
 * Smoke test Gate 4 cohorts API against local stack.
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

  const courseRes = await fetch(`${API}/courses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: `Cohort Smoke ${Date.now()}`,
      shortDescription: "Curso para smoke de turma",
    }),
  });
  if (!courseRes.ok) throw new Error(`course create failed: ${await courseRes.text()}`);
  const course = await courseRes.json();
  console.log("course", course.id);

  const cohortRes = await fetch(`${API}/cohorts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Turma Smoke Agosto",
      code: `SMOKE-${Date.now().toString().slice(-6)}`,
      courseId: course.id,
      maxStudents: 30,
    }),
  });
  if (!cohortRes.ok) throw new Error(`cohort create failed: ${await cohortRes.text()}`);
  const cohort = await cohortRes.json();
  console.log("cohort", cohort.id, cohort.status);

  const openRes = await fetch(`${API}/cohorts/${cohort.id}/open`, {
    method: "POST",
    headers,
  });
  if (!openRes.ok) throw new Error(`open failed: ${await openRes.text()}`);
  const opened = await openRes.json();
  console.log("opened", opened.status);

  const instructorsRes = await fetch(`${API}/instructors?status=ACTIVE`, { headers });
  if (!instructorsRes.ok) throw new Error("instructors list failed");
  const instructors = await instructorsRes.json();
  const membershipId = instructors.items?.[0]?.membershipId;
  if (membershipId) {
    const assignRes = await fetch(`${API}/cohorts/${cohort.id}/instructors`, {
      method: "POST",
      headers,
      body: JSON.stringify({ membershipId, role: "LEAD" }),
    });
    if (!assignRes.ok) throw new Error(`assign failed: ${await assignRes.text()}`);
    const assigned = await assignRes.json();
    console.log("instructors", assigned.instructors?.length);
  } else {
    console.log("no_instructor_to_assign");
  }

  const listRes = await fetch(`${API}/cohorts?status=OPEN`, { headers });
  if (!listRes.ok) throw new Error("list failed");
  const list = await listRes.json();
  console.log("list_total", list.meta.total);

  console.log("PASS: cohorts API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
