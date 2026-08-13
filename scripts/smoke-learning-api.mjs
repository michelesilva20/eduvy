/**
 * Smoke test Gate 6 learning / progress API against local stack.
 * Requires: postgres migrated + seeded + API on :4000
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
    body: JSON.stringify({
      email,
      password: "Eduvy@2026!",
    }),
  });
  if (!loginRes.ok) throw new Error(`login ${email} failed: ${loginRes.status}`);
  const login = await loginRes.json();
  return login.accessToken;
}

async function tenantIdFor(token) {
  const tenantsRes = await fetch(`${API}/tenants/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!tenantsRes.ok) throw new Error(`tenants failed: ${tenantsRes.status}`);
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
    body: JSON.stringify({ title: `Learning Smoke ${Date.now()}` }),
  });
  if (!courseRes.ok) throw new Error(`course failed: ${await courseRes.text()}`);
  const course = await courseRes.json();

  const modRes = await fetch(`${API}/courses/${course.id}/modules`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ title: "Módulo Player" }),
  });
  if (!modRes.ok) throw new Error(`module failed: ${await modRes.text()}`);
  const afterModule = await modRes.json();
  const moduleId = afterModule.modules[0]?.id;

  const lessonRes = await fetch(
    `${API}/courses/${course.id}/modules/${moduleId}/lessons`,
    {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({ title: "Aula 1", type: "TEXT" }),
    },
  );
  if (!lessonRes.ok) throw new Error(`lesson failed: ${await lessonRes.text()}`);
  const afterLesson = await lessonRes.json();
  const lessonId = afterLesson.modules[0]?.lessons[0]?.id;
  const contentId = afterLesson.modules[0]?.lessons[0]?.contents[0]?.id;

  await fetch(
    `${API}/courses/${course.id}/lessons/${lessonId}/contents/${contentId}`,
    {
      method: "PATCH",
      headers: ownerHeaders,
      body: JSON.stringify({ textContent: "Conteúdo do player smoke" }),
    },
  );

  const publishRes = await fetch(`${API}/courses/${course.id}/publish`, {
    method: "POST",
    headers: ownerHeaders,
  });
  if (!publishRes.ok) throw new Error(`publish failed: ${await publishRes.text()}`);

  const cohortRes = await fetch(`${API}/cohorts`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      name: "Turma Learning Smoke",
      courseId: course.id,
    }),
  });
  if (!cohortRes.ok) throw new Error(`cohort failed: ${await cohortRes.text()}`);
  const cohort = await cohortRes.json();

  await fetch(`${API}/cohorts/${cohort.id}/open`, {
    method: "POST",
    headers: ownerHeaders,
  });

  const studentsRes = await fetch(`${API}/students?status=ACTIVE`, {
    headers: ownerHeaders,
  });
  if (!studentsRes.ok) throw new Error("students list failed");
  const students = await studentsRes.json();
  const membershipId = students.items?.find(
    (s) => s.email === "aluno@horizonte.demo",
  )?.membershipId;
  if (!membershipId) throw new Error("demo student not found");

  const enrollRes = await fetch(`${API}/cohorts/${cohort.id}/enrollments`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ membershipId }),
  });
  if (!enrollRes.ok) throw new Error(`enroll failed: ${await enrollRes.text()}`);
  const enrollment = await enrollRes.json();
  console.log("enrollment", enrollment.id);

  const studentToken = await login("aluno@horizonte.demo");
  const studentHeaders = headers(studentToken, tenantId);

  const myRes = await fetch(`${API}/learning/my-courses`, {
    headers: studentHeaders,
  });
  if (!myRes.ok) throw new Error(`my-courses failed: ${await myRes.text()}`);
  const myCourses = await myRes.json();
  const mine = myCourses.find((c) => c.enrollmentId === enrollment.id);
  if (!mine) throw new Error("enrollment missing in my-courses");
  console.log("my-courses", mine.progressPercentage);

  const playerRes = await fetch(`${API}/learning/${enrollment.id}`, {
    headers: studentHeaders,
  });
  if (!playerRes.ok) throw new Error(`player failed: ${await playerRes.text()}`);
  const player = await playerRes.json();
  if (!player.modules?.[0]?.lessons?.length) throw new Error("player empty");
  console.log("player", player.courseTitle, player.totalLessons);

  const startRes = await fetch(
    `${API}/learning/${enrollment.id}/lessons/${lessonId}/start`,
    { method: "POST", headers: studentHeaders },
  );
  if (!startRes.ok) throw new Error(`start failed: ${await startRes.text()}`);
  const started = await startRes.json();
  const startedLesson = started.modules[0].lessons.find((l) => l.id === lessonId);
  if (startedLesson.progress.status !== "IN_PROGRESS") {
    throw new Error(`expected IN_PROGRESS, got ${startedLesson.progress.status}`);
  }
  console.log("started");

  const completeRes = await fetch(
    `${API}/learning/${enrollment.id}/lessons/${lessonId}/complete`,
    { method: "POST", headers: studentHeaders },
  );
  if (!completeRes.ok) throw new Error(`complete failed: ${await completeRes.text()}`);
  const completed = await completeRes.json();
  if (completed.progressPercentage !== 100) {
    throw new Error(`expected 100%, got ${completed.progressPercentage}`);
  }
  console.log("completed", completed.progressPercentage);

  const idempotentRes = await fetch(
    `${API}/learning/${enrollment.id}/lessons/${lessonId}/complete`,
    { method: "POST", headers: studentHeaders },
  );
  if (!idempotentRes.ok) throw new Error("complete idempotent failed");
  console.log("idempotent_ok");

  console.log("PASS: learning API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
