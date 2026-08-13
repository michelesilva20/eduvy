/**
 * Smoke test Gate 5 enrollments API against local stack.
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
    body: JSON.stringify({ title: `Enrollment Smoke ${Date.now()}` }),
  });
  if (!courseRes.ok) throw new Error(`course failed: ${await courseRes.text()}`);
  const course = await courseRes.json();

  const cohortRes = await fetch(`${API}/cohorts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Turma Matrículas Smoke",
      courseId: course.id,
      maxStudents: 10,
    }),
  });
  if (!cohortRes.ok) throw new Error(`cohort failed: ${await cohortRes.text()}`);
  const cohort = await cohortRes.json();
  console.log("cohort", cohort.id);

  await fetch(`${API}/cohorts/${cohort.id}/open`, { method: "POST", headers });

  const studentsRes = await fetch(`${API}/students?status=ACTIVE`, { headers });
  if (!studentsRes.ok) throw new Error("students list failed");
  const students = await studentsRes.json();
  const membershipId = students.items?.[0]?.membershipId;
  if (!membershipId) throw new Error("no student to enroll");

  const enrollRes = await fetch(`${API}/cohorts/${cohort.id}/enrollments`, {
    method: "POST",
    headers,
    body: JSON.stringify({ membershipId }),
  });
  if (!enrollRes.ok) throw new Error(`enroll failed: ${await enrollRes.text()}`);
  const enrollment = await enrollRes.json();
  console.log("enrolled", enrollment.id, enrollment.status);

  const bulkRes = await fetch(`${API}/cohorts/${cohort.id}/enrollments/bulk`, {
    method: "POST",
    headers,
    body: JSON.stringify({ membershipIds: [membershipId] }),
  });
  if (!bulkRes.ok) throw new Error(`bulk failed: ${await bulkRes.text()}`);
  const bulk = await bulkRes.json();
  console.log("bulk", bulk.enrolled, bulk.alreadyEnrolled, bulk.failed);
  if (bulk.alreadyEnrolled !== 1) throw new Error("expected already enrolled");

  const listRes = await fetch(`${API}/cohorts/${cohort.id}/enrollments`, { headers });
  if (!listRes.ok) throw new Error("list enrollments failed");
  const list = await listRes.json();
  console.log("list_total", list.meta.total);

  const cancelRes = await fetch(`${API}/enrollments/${enrollment.id}/cancel`, {
    method: "POST",
    headers,
  });
  if (!cancelRes.ok) throw new Error(`cancel failed: ${await cancelRes.text()}`);
  console.log("cancelled", (await cancelRes.json()).status);

  console.log("PASS: enrollments API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
