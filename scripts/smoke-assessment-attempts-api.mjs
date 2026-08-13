/**
 * Smoke Gate 9/10 — Assessment attempts via assignment
 * (admin publish → assign cohort → student attempt → submit).
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
  if (!loginRes.ok) throw new Error(`login ${email}: ${loginRes.status}`);
  const token = (await loginRes.json()).accessToken;
  const tenantsRes = await fetch(`${API}/tenants/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tenants = await tenantsRes.json();
  const tenantId = tenants[0]?.id;
  if (!tenantId) throw new Error(`no tenant for ${email}`);
  return {
    token,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-eduvy-tenant-id": tenantId,
      "x-eduvy-bff-secret": BFF,
    },
  };
}

async function main() {
  const admin = await login("owner@horizonte.demo");
  const stamp = Date.now();

  const courseRes = await fetch(`${API}/courses`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ title: `Attempt Smoke Course ${stamp}` }),
  });
  if (!courseRes.ok) throw new Error(`course: ${await courseRes.text()}`);
  const course = await courseRes.json();

  const publishCourse = await fetch(`${API}/courses/${course.id}/publish`, {
    method: "POST",
    headers: admin.headers,
  });
  if (!publishCourse.ok) throw new Error(`publish course: ${await publishCourse.text()}`);

  const cohortRes = await fetch(`${API}/cohorts`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ name: `Turma Attempt ${stamp}`, courseId: course.id }),
  });
  if (!cohortRes.ok) throw new Error(`cohort: ${await cohortRes.text()}`);
  const cohort = await cohortRes.json();

  await fetch(`${API}/cohorts/${cohort.id}/open`, {
    method: "POST",
    headers: admin.headers,
  });

  const studentsRes = await fetch(`${API}/students?status=ACTIVE`, {
    headers: admin.headers,
  });
  if (!studentsRes.ok) throw new Error(`students: ${await studentsRes.text()}`);
  const students = await studentsRes.json();
  const membershipId = students.items?.find(
    (s) => s.email === "aluno@horizonte.demo",
  )?.membershipId;
  if (!membershipId) throw new Error("demo student not found");

  const enrollRes = await fetch(`${API}/cohorts/${cohort.id}/enrollments`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ membershipId }),
  });
  if (!enrollRes.ok) throw new Error(`enroll: ${await enrollRes.text()}`);

  const assessmentRes = await fetch(`${API}/assessments`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      title: `Attempt Smoke ${stamp}`,
      maxAttempts: 2,
      timeLimitMinutes: 30,
      passingScore: 50,
    }),
  });
  if (!assessmentRes.ok) throw new Error(`create assessment: ${await assessmentRes.text()}`);
  const assessment = await assessmentRes.json();

  const q1Res = await fetch(`${API}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      stem: "Capital do Brasil?",
      type: "SINGLE_CHOICE",
      options: [
        { text: "Rio", isCorrect: false },
        { text: "Brasília", isCorrect: true },
      ],
    }),
  });
  if (!q1Res.ok) throw new Error(`q1: ${await q1Res.text()}`);
  const q1 = await q1Res.json();

  const q2Res = await fetch(`${API}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      stem: "Selecione pares",
      type: "MULTIPLE_CHOICE",
      options: [
        { text: "2", isCorrect: true },
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
      ],
    }),
  });
  if (!q2Res.ok) throw new Error(`q2: ${await q2Res.text()}`);
  const q2 = await q2Res.json();

  for (const questionId of [q1.id, q2.id]) {
    const attach = await fetch(`${API}/assessments/${assessment.id}/questions`, {
      method: "POST",
      headers: admin.headers,
      body: JSON.stringify({ questionId }),
    });
    if (!attach.ok) throw new Error(`attach: ${await attach.text()}`);
  }

  const publish = await fetch(`${API}/assessments/${assessment.id}/publish`, {
    method: "POST",
    headers: admin.headers,
  });
  if (!publish.ok) throw new Error(`publish: ${await publish.text()}`);

  const assignRes = await fetch(`${API}/assessments/${assessment.id}/assignments`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      cohortId: cohort.id,
      attemptsAllowed: 2,
      timeLimitMinutes: 30,
      resultVisibility: "AFTER_SUBMISSION",
    }),
  });
  if (!assignRes.ok) throw new Error(`assign: ${await assignRes.text()}`);
  const assignment = await assignRes.json();

  const student = await login("aluno@horizonte.demo");

  const startA = await fetch(
    `${API}/assessment-assignments/${assignment.id}/attempts`,
    { method: "POST", headers: student.headers },
  );
  if (!startA.ok) throw new Error(`start: ${await startA.text()}`);
  const attemptA = await startA.json();

  // Double-click / concurrent start must resume same attempt
  const startB = await fetch(
    `${API}/assessment-assignments/${assignment.id}/attempts`,
    { method: "POST", headers: student.headers },
  );
  if (!startB.ok) throw new Error(`start resume: ${await startB.text()}`);
  const attemptB = await startB.json();
  if (attemptA.id !== attemptB.id) throw new Error("duplicate in-progress attempt created");

  // Payload must not leak answer keys
  const leaked = JSON.stringify(attemptA).includes("isCorrect");
  if (leaked) throw new Error("answer key leaked in player payload");
  if (attemptA.questions.some((q) => q.correctAnswer != null || q.explanation != null)) {
    throw new Error("admin fields present in student DTO");
  }

  const correctOpt = attemptA.questions[0].options[1]?.id;
  const save1 = await fetch(
    `${API}/assessment-attempts/${attemptA.id}/answers/${attemptA.questions[0].id}`,
    {
      method: "PUT",
      headers: student.headers,
      body: JSON.stringify({ selectedOptionIds: [correctOpt] }),
    },
  );
  if (!save1.ok) throw new Error(`save1: ${await save1.text()}`);

  const multiOpts = attemptA.questions[1].options;
  const save2 = await fetch(
    `${API}/assessment-attempts/${attemptA.id}/answers/${attemptA.questions[1].id}`,
    {
      method: "PUT",
      headers: student.headers,
      body: JSON.stringify({
        selectedOptionIds: [multiOpts[0].id, multiOpts[2].id],
      }),
    },
  );
  if (!save2.ok) throw new Error(`save2: ${await save2.text()}`);

  // Idempotent overwrite
  const save2b = await fetch(
    `${API}/assessment-attempts/${attemptA.id}/answers/${attemptA.questions[1].id}`,
    {
      method: "PUT",
      headers: student.headers,
      body: JSON.stringify({
        selectedOptionIds: [multiOpts[0].id, multiOpts[2].id],
      }),
    },
  );
  if (!save2b.ok) throw new Error(`save overwrite: ${await save2b.text()}`);

  const submit1 = await fetch(`${API}/assessment-attempts/${attemptA.id}/submit`, {
    method: "POST",
    headers: student.headers,
  });
  if (!submit1.ok) throw new Error(`submit: ${await submit1.text()}`);
  const result1 = await submit1.json();
  if (result1.scorePercentage !== 100) {
    throw new Error(`expected 100%, got ${result1.scorePercentage}`);
  }

  const submit2 = await fetch(`${API}/assessment-attempts/${attemptA.id}/submit`, {
    method: "POST",
    headers: student.headers,
  });
  if (!submit2.ok) throw new Error(`double submit: ${await submit2.text()}`);
  const result2 = await submit2.json();
  if (result2.scorePercentage !== result1.scorePercentage) {
    throw new Error("double submit changed score");
  }

  // Cross-tenant / ownership: admin cannot use student attempt without assessments.attempt?
  // Admin as TENANT_OWNER has assessments.attempt but different membership — should be forbidden.
  const steal = await fetch(`${API}/assessment-attempts/${attemptA.id}`, {
    headers: admin.headers,
  });
  if (steal.ok) {
    const stolen = await steal.json();
    if (stolen.id === attemptA.id && stolen.membershipId === attemptA.membershipId) {
      // Owner has own membership — may get FORBIDDEN if membership differs
    }
  }
  if (steal.status !== 403 && steal.status !== 404) {
    // Owner is different membership → must be forbidden
    if (steal.ok) throw new Error("owner accessed student attempt unexpectedly");
  }

  console.log("PASS smoke-assessment-attempts-api");
  console.log({
    assessmentId: assessment.id,
    assignmentId: assignment.id,
    attemptId: attemptA.id,
    scorePercentage: result1.scorePercentage,
  });
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
