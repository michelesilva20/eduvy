/**
 * Smoke test Gate 2 course content API against local stack.
 * Requires: postgres migrated + seeded + API on :4000
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
      title: "Smoke Content Course",
      shortDescription: "Gate 2 structure test",
    }),
  });
  if (!createRes.ok) {
    throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`);
  }
  const course = await createRes.json();
  console.log("course", course.id);

  const modRes = await fetch(`${API}/courses/${course.id}/modules`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title: "Módulo 1" }),
  });
  if (!modRes.ok) {
    throw new Error(`module failed: ${modRes.status} ${await modRes.text()}`);
  }
  const afterModule = await modRes.json();
  const moduleId = afterModule.modules[0]?.id;
  if (!moduleId) throw new Error("module not created");
  console.log("module", moduleId);

  const lessonRes = await fetch(`${API}/courses/${course.id}/modules/${moduleId}/lessons`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title: "Aula intro", type: "TEXT" }),
  });
  if (!lessonRes.ok) {
    throw new Error(`lesson failed: ${lessonRes.status} ${await lessonRes.text()}`);
  }
  const afterLesson = await lessonRes.json();
  const lessonId = afterLesson.modules[0]?.lessons[0]?.id;
  const contentId = afterLesson.modules[0]?.lessons[0]?.contents[0]?.id;
  if (!lessonId || !contentId) throw new Error("lesson/content not created");
  console.log("lesson", lessonId, "content", contentId);

  const contentRes = await fetch(
    `${API}/courses/${course.id}/lessons/${lessonId}/contents/${contentId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ textContent: "Conteúdo smoke test" }),
    },
  );
  if (!contentRes.ok) {
    throw new Error(`content patch failed: ${contentRes.status} ${await contentRes.text()}`);
  }
  console.log("content_updated");

  const structureRes = await fetch(`${API}/courses/${course.id}/structure`, { headers });
  if (!structureRes.ok) {
    throw new Error(`structure failed: ${structureRes.status}`);
  }
  const structure = await structureRes.json();
  if (structure.modules.length !== 1 || structure.modules[0].lessons.length !== 1) {
    throw new Error("structure mismatch");
  }
  console.log("structure_ok", structure.modules[0].lessons[0].contents[0].textContent);

  const reorderRes = await fetch(`${API}/courses/${course.id}/modules/reorder`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ orderedIds: [moduleId] }),
  });
  if (!reorderRes.ok) {
    throw new Error(`reorder failed: ${reorderRes.status}`);
  }
  console.log("reorder_ok");

  console.log("PASS: course content API smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
