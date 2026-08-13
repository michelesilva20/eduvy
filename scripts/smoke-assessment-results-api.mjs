/**
 * Smoke Gate 11 — Professor results + manual SHORT_TEXT grade.
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
    body: JSON.stringify({ title: `Results Smoke Course ${stamp}` }),
  });
  if (!courseRes.ok) throw new Error(`course: ${await courseRes.text()}`);
  const course = await courseRes.json();

  await fetch(`${API}/courses/${course.id}/publish`, {
    method: "POST",
    headers: admin.headers,
  });

  const cohortRes = await fetch(`${API}/cohorts`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ name: `Turma Results ${stamp}`, courseId: course.id }),
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
    body: JSON.stringify({ title: `Results Smoke ${stamp}`, passingScore: 50 }),
  });
  if (!assessmentRes.ok) throw new Error(`assessment: ${await assessmentRes.text()}`);
  const assessment = await assessmentRes.json();

  const q1Res = await fetch(`${API}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      stem: "2+2?",
      type: "SINGLE_CHOICE",
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
      ],
      points: 1,
    }),
  });
  const q1 = await q1Res.json();

  const q2Res = await fetch(`${API}/questions`, {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({
      stem: "Explique brevemente.",
      type: "SHORT_TEXT",
      points: 1,
    }),
  });
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
      resultVisibility: "AFTER_SUBMISSION",
    }),
  });
  if (!assignRes.ok) throw new Error(`assign: ${await assignRes.text()}`);
  const assignment = await assignRes.json();

  const start = await fetch(
    `${API}/assessment-assignments/${assignment.id}/attempts`,
    { method: "POST", headers: student.headers },
  );
  if (!start.ok) throw new Error(`start: ${await start.text()}`);
  const attempt = await start.json();

  const correct = attempt.questions[0].options[1].id;
  await fetch(
    `${API}/assessment-attempts/${attempt.id}/answers/${attempt.questions[0].id}`,
    {
      method: "PUT",
      headers: student.headers,
      body: JSON.stringify({ selectedOptionIds: [correct] }),
    },
  );
  await fetch(
    `${API}/assessment-attempts/${attempt.id}/answers/${attempt.questions[1].id}`,
    {
      method: "PUT",
      headers: student.headers,
      body: JSON.stringify({ textAnswer: "Resposta do aluno smoke" }),
    },
  );

  const submit = await fetch(`${API}/assessment-attempts/${attempt.id}/submit`, {
    method: "POST",
    headers: student.headers,
  });
  if (!submit.ok) throw new Error(`submit: ${await submit.text()}`);
  const studentResult = await submit.json();
  if (!studentResult.pendingManualGrade) {
    throw new Error("expected pendingManualGrade after SHORT_TEXT submit");
  }

  const resultsRes = await fetch(`${API}/assessments/${assessment.id}/results`, {
    headers: admin.headers,
  });
  if (!resultsRes.ok) throw new Error(`results: ${await resultsRes.text()}`);
  const results = await resultsRes.json();
  if (results.summary.studentsCount < 1) throw new Error("studentsCount expected");
  const row = results.items.find((item) => item.attemptId === attempt.id);
  if (!row) throw new Error("student row missing");
  if (!row.pendingManualGrade) throw new Error("row should await grade");

  const detailRes = await fetch(
    `${API}/assessment-attempts/${attempt.id}/instructor`,
    { headers: admin.headers },
  );
  if (!detailRes.ok) throw new Error(`instructor: ${await detailRes.text()}`);
  const detail = await detailRes.json();
  const shortQ = detail.answers.find((a) => a.type === "SHORT_TEXT");
  if (!shortQ?.pendingManual) throw new Error("short text not pending");

  const gradeRes = await fetch(
    `${API}/assessment-attempts/${attempt.id}/answers/${shortQ.questionId}/grade`,
    {
      method: "PATCH",
      headers: admin.headers,
      body: JSON.stringify({ isCorrect: true, pointsAwarded: 1 }),
    },
  );
  if (!gradeRes.ok) throw new Error(`grade: ${await gradeRes.text()}`);
  const graded = await gradeRes.json();
  if (graded.pendingManualGrade) throw new Error("should be fully graded");
  if (graded.scorePercentage !== 100) {
    throw new Error(`expected 100 got ${graded.scorePercentage}`);
  }

  const studentForbidden = await fetch(
    `${API}/assessments/${assessment.id}/results`,
    { headers: student.headers },
  );
  if (studentForbidden.status !== 403) {
    throw new Error(`student should be forbidden, got ${studentForbidden.status}`);
  }

  console.log("PASS smoke-assessment-results-api");
  console.log({
    assessmentId: assessment.id,
    attemptId: attempt.id,
    scorePercentage: graded.scorePercentage,
  });
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
