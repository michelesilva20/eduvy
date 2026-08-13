/**
 * Smoke Gate 10 — Assignment required for student attempts.
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
  const student = await login("aluno@horizonte.demo");
  const stamp = Date.now();

  const courseRes = await fetch(`${API}/courses`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ title: `Assign Smoke Course ${stamp}` }),
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
    body: JSON.stringify({ name: `Turma Assign ${stamp}`, courseId: course.id }),
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
      title: `Assignment Smoke ${stamp}`,
      maxAttempts: 3,
      passingScore: 50,
    }),
  });
  if (!assessmentRes.ok) throw new Error(`create assessment: ${await assessmentRes.text()}`);
  const assessment = await assessmentRes.json();

  const qRes = await fetch(`${API}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      stem: "2+2?",
      type: "SINGLE_CHOICE",
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
      ],
    }),
  });
  if (!qRes.ok) throw new Error(`question: ${await qRes.text()}`);
  const question = await qRes.json();

  const attach = await fetch(`${API}/assessments/${assessment.id}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ questionId: question.id }),
  });
  if (!attach.ok) throw new Error(`attach: ${await attach.text()}`);

  const publish = await fetch(`${API}/assessments/${assessment.id}/publish`, {
    method: "POST",
    headers: admin.headers,
  });
  if (!publish.ok) throw new Error(`publish: ${await publish.text()}`);

  const mineBefore = await fetch(`${API}/my-assessments`, {
    headers: student.headers,
  });
  if (!mineBefore.ok) throw new Error(`mine before: ${await mineBefore.text()}`);
  const before = await mineBefore.json();
  if (before.some((item) => item.id === assessment.id)) {
    throw new Error("unassigned assessment should not appear for student");
  }

  const assignRes = await fetch(`${API}/assessments/${assessment.id}/assignments`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      cohortId: cohort.id,
      attemptsAllowed: 2,
      resultVisibility: "AFTER_SUBMISSION",
      availableUntil: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
    }),
  });
  if (!assignRes.ok) throw new Error(`assign: ${await assignRes.text()}`);
  const assignment = await assignRes.json();

  const mineAfter = await fetch(`${API}/my-assessments`, {
    headers: student.headers,
  });
  if (!mineAfter.ok) throw new Error(`mine after: ${await mineAfter.text()}`);
  const after = await mineAfter.json();
  const visible = after.find((item) => item.assignmentId === assignment.id);
  if (!visible) throw new Error("assigned assessment not visible to enrolled student");
  if (visible.cohortName !== assignment.cohortName) {
    throw new Error("cohort context missing");
  }

  const start = await fetch(
    `${API}/assessment-assignments/${assignment.id}/attempts`,
    { method: "POST", headers: student.headers },
  );
  if (!start.ok) throw new Error(`start: ${await start.text()}`);
  const attempt = await start.json();
  if (JSON.stringify(attempt).includes("isCorrect")) {
    throw new Error("answer key leaked");
  }

  const correct = attempt.questions[0].options[1].id;
  const save = await fetch(
    `${API}/assessment-attempts/${attempt.id}/answers/${attempt.questions[0].id}`,
    {
      method: "PUT",
      headers: student.headers,
      body: JSON.stringify({ selectedOptionIds: [correct] }),
    },
  );
  if (!save.ok) throw new Error(`save: ${await save.text()}`);

  const submit = await fetch(`${API}/assessment-attempts/${attempt.id}/submit`, {
    method: "POST",
    headers: student.headers,
  });
  if (!submit.ok) throw new Error(`submit: ${await submit.text()}`);
  const result = await submit.json();
  if (!result.resultVisible) throw new Error("result should be visible AFTER_SUBMISSION");
  if (result.scorePercentage !== 100) {
    throw new Error(`expected 100 got ${result.scorePercentage}`);
  }

  const lock = await fetch(`${API}/assessments/${assessment.id}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ questionId: question.id }),
  });
  if (lock.ok) throw new Error("expected assessment locked after assignment");

  console.log("PASS smoke-assessment-assignments-api");
  console.log({
    assessmentId: assessment.id,
    assignmentId: assignment.id,
    attemptId: attempt.id,
    cohortId: cohort.id,
  });
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
