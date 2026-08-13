/**
 * Smoke test Gate 8 assessments foundation against local stack.
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
  const token = (await loginRes.json()).accessToken;

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

  const assessmentRes = await fetch(`${API}/assessments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: `Assessment Smoke ${Date.now()}`,
      description: "Gate 8 foundation",
      passingScore: 70,
    }),
  });
  if (!assessmentRes.ok) throw new Error(`create assessment: ${await assessmentRes.text()}`);
  const assessment = await assessmentRes.json();
  console.log("assessment", assessment.id);

  const questionRes = await fetch(`${API}/questions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      stem: "Quanto é 2 + 2?",
      type: "SINGLE_CHOICE",
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
      ],
    }),
  });
  if (!questionRes.ok) throw new Error(`create question: ${await questionRes.text()}`);
  const question = await questionRes.json();
  console.log("question", question.id);

  const attachRes = await fetch(`${API}/assessments/${assessment.id}/questions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ questionId: question.id }),
  });
  if (!attachRes.ok) throw new Error(`attach: ${await attachRes.text()}`);
  const attached = await attachRes.json();
  if (attached.questionsCount !== 1) throw new Error("expected 1 question");
  console.log("attached", attached.questionsCount);

  const emptyPublish = await fetch(`${API}/assessments/${assessment.id}/publish`, {
    method: "POST",
    headers,
  });
  // should succeed because we attached one
  if (!emptyPublish.ok) throw new Error(`publish: ${await emptyPublish.text()}`);
  const published = await emptyPublish.json();
  if (published.status !== "PUBLISHED") throw new Error("not published");
  console.log("published", published.status);

  const listRes = await fetch(`${API}/assessments?status=PUBLISHED`, { headers });
  if (!listRes.ok) throw new Error("list failed");
  const list = await listRes.json();
  console.log("list_total", list.meta.total);

  console.log("PASS: assessments API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
