import { ensureUniqueCourseSlug, slugifyCourseTitle } from "./course.slug";

describe("course.slug", () => {
  it("slugifies titles with accents and spaces", () => {
    expect(slugifyCourseTitle("  React para Iniciantes!  ")).toBe("react-para-iniciantes");
    expect(slugifyCourseTitle("Preparação ENEM — Linguagens")).toBe("preparacao-enem-linguagens");
  });

  it("ensures unique slug with numeric suffix", async () => {
    const taken = new Set(["curso", "curso-2"]);
    const slug = await ensureUniqueCourseSlug("curso", async (candidate) => taken.has(candidate));
    expect(slug).toBe("curso-3");
  });
});
