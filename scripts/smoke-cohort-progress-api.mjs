/**
 * Smoke test Gate 7 cohort progress API against local stack.
 */
const API = process.env.EDUVY_API_URL ?? "http://localhost:4000/api/v1";
const BFF = process.env.EDUVY_BFF_SECRET ?? process.env.BFF_SHARED_SECRET;

async function login(email) {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-eduvy-bff-secret": BFF,
    },
    body: JSON.stringify({ email, password: "Eduvy@2026!" }),
  });
  if (!loginRes.ok) throw new Error(`login ${email} failed: ${loginRes.status}`);
  return (await loginRes.json()).accessToken;
}

async function tenantIdFor(token) {
  const tenantsRes = await fetch(`${API}/tenants/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tenants = await tenantsRes.json();
  const id = tenants[0]?.id;
  if (!id) throw new Error("no tenant");
  return id;
}

function headers(token, tenantId) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-eduvy-tenant-id": tenantId,
  };
}

async function main() {
  const ownerToken = await login("owner@horizonte.demo");
  const tenantId = await tenantIdFor(ownerToken);
  const ownerHeaders = headers(ownerToken, tenantId);

  const courseRes = await fetch(`${API}/courses`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ title: `Progress Smoke ${Date.now()}` }),
  });
  if (!courseRes.ok) throw new Error(`course failed: ${await courseRes.text()}`);
  const course = await courseRes.json();

  const modRes = await fetch(`${API}/courses/${course.id}/modules`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ title: "Módulo" }),
  });
  const afterModule = await modRes.json();
  const moduleId = afterModule.modules[0]?.id;

  const lessonRes = await fetch(
    `${API}/courses/${course.id}/modules/${moduleId}/lessons`,
    {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({ title: "Aula", type: "TEXT" }),
    },
  );
  const afterLesson = await lessonRes.json();
  const lessonId = afterLesson.modules[0]?.lessons[0]?.id;

  await fetch(`${API}/courses/${course.id}/publish`, {
    method: "POST",
    headers: ownerHeaders,
  });

  const cohortRes = await fetch(`${API}/cohorts`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ name: "Turma Progress Smoke", courseId: course.id }),
  });
  if (!cohortRes.ok) throw new Error(`cohort failed: ${await cohortRes.text()}`);
  const cohort = await cohortRes.json();
  await fetch(`${API}/cohorts/${cohort.id}/open`, { method: "POST", headers: ownerHeaders });

  const instructorsRes = await fetch(`${API}/instructors?status=ACTIVE`, {
    headers: ownerHeaders,
  });
  const instructors = await instructorsRes.json();
  const instructorMembershipId = instructors.items?.find(
    (i) => i.email === "professor@horizonte.demo",
  )?.membershipId;
  if (instructorMembershipId) {
    await fetch(`${API}/cohorts/${cohort.id}/instructors`, {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({ membershipId: instructorMembershipId, role: "LEAD" }),
    });
  }

  const studentsRes = await fetch(`${API}/students?status=ACTIVE`, {
    headers: ownerHeaders,
  });
  const students = await studentsRes.json();
  const membershipId = students.items?.find(
    (s) => s.email === "aluno@horizonte.demo",
  )?.membershipId;
  if (!membershipId) throw new Error("demo student missing");

  const enrollRes = await fetch(`${API}/cohorts/${cohort.id}/enrollments`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ membershipId }),
  });
  if (!enrollRes.ok) throw new Error(`enroll failed: ${await enrollRes.text()}`);
  const enrollment = await enrollRes.json();

  const emptyProgress = await fetch(`${API}/cohorts/${cohort.id}/progress`, {
    headers: ownerHeaders,
  });
  if (!emptyProgress.ok) throw new Error(`progress failed: ${await emptyProgress.text()}`);
  const before = await emptyProgress.json();
  const row = before.items.find((i) => i.enrollmentId === enrollment.id);
  if (!row || row.progressStatus !== "NOT_STARTED") {
    throw new Error("expected NOT_STARTED before access");
  }
  console.log("before", row.progressPercentage, row.progressStatus);

  const studentToken = await login("aluno@horizonte.demo");
  const studentHeaders = headers(studentToken, tenantId);
  await fetch(`${API}/learning/${enrollment.id}/lessons/${lessonId}/complete`, {
    method: "POST",
    headers: studentHeaders,
  });

  const afterProgress = await fetch(
    `${API}/cohorts/${cohort.id}/progress?filter=COMPLETED`,
    { headers: ownerHeaders },
  );
  if (!afterProgress.ok) throw new Error(`filter failed: ${await afterProgress.text()}`);
  const after = await afterProgress.json();
  const completed = after.items.find((i) => i.enrollmentId === enrollment.id);
  if (!completed || completed.progressPercentage !== 100) {
    throw new Error("expected COMPLETED 100%");
  }
  console.log("after", completed.progressPercentage, after.studentsCount);

  const professorToken = await login("professor@horizonte.demo");
  const professorHeaders = headers(professorToken, tenantId);
  const profRes = await fetch(`${API}/cohorts/${cohort.id}/progress`, {
    headers: professorHeaders,
  });
  if (!profRes.ok) {
    throw new Error(`professor progress failed: ${profRes.status} ${await profRes.text()}`);
  }
  console.log("professor_ok");

  console.log("PASS: cohort progress API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
