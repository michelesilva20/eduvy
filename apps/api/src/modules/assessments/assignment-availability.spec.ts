import {
  canAccessAssignment,
  isResultVisible,
  resolveAttemptsAllowed,
  resolveAvailabilityWindow,
} from "./assignment-availability";

describe("assignment-availability", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("prefers assignment window over assessment window", () => {
    const window = resolveAvailabilityWindow({
      assignmentFrom: new Date("2026-08-10T00:00:00.000Z"),
      assignmentUntil: new Date("2026-08-20T00:00:00.000Z"),
      assessmentFrom: new Date("2026-08-01T00:00:00.000Z"),
      assessmentUntil: new Date("2026-08-31T00:00:00.000Z"),
    });
    expect(window.availableFrom?.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    expect(window.availableUntil?.toISOString()).toBe("2026-08-20T00:00:00.000Z");
  });

  it("uses assignment attempts when present", () => {
    expect(resolveAttemptsAllowed(1, 5)).toBe(1);
    expect(resolveAttemptsAllowed(null, 5)).toBe(5);
    expect(resolveAttemptsAllowed(null, null)).toBeNull();
  });

  it("denies unpublished, inactive, unenrolled, outside window, exhausted", () => {
    expect(
      canAccessAssignment({
        assessmentPublished: false,
        assignmentActive: true,
        enrolled: true,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: null,
        usedCount: 0,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);

    expect(
      canAccessAssignment({
        assessmentPublished: true,
        assignmentActive: false,
        enrolled: true,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: null,
        usedCount: 0,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);

    expect(
      canAccessAssignment({
        assessmentPublished: true,
        assignmentActive: true,
        enrolled: false,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: null,
        usedCount: 0,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);

    expect(
      canAccessAssignment({
        assessmentPublished: true,
        assignmentActive: true,
        enrolled: true,
        availableFrom: new Date("2026-08-14T00:00:00.000Z"),
        availableUntil: null,
        maxAttempts: null,
        usedCount: 0,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);

    expect(
      canAccessAssignment({
        assessmentPublished: true,
        assignmentActive: true,
        enrolled: true,
        availableFrom: null,
        availableUntil: new Date("2026-08-12T00:00:00.000Z"),
        maxAttempts: null,
        usedCount: 0,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);

    expect(
      canAccessAssignment({
        assessmentPublished: true,
        assignmentActive: true,
        enrolled: true,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: 1,
        usedCount: 1,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);
  });

  it("allows resume even after deadline", () => {
    expect(
      canAccessAssignment({
        assessmentPublished: true,
        assignmentActive: true,
        enrolled: true,
        availableFrom: null,
        availableUntil: new Date("2026-08-12T00:00:00.000Z"),
        maxAttempts: 1,
        usedCount: 1,
        hasInProgress: true,
        now,
      }).ok,
    ).toBe(true);
  });

  it("applies result visibility policies", () => {
    expect(
      isResultVisible({
        visibility: "AFTER_SUBMISSION",
        status: "GRADED",
        availableUntil: null,
        now,
      }),
    ).toBe(true);

    expect(
      isResultVisible({
        visibility: "AFTER_DEADLINE",
        status: "GRADED",
        availableUntil: new Date("2026-08-20T00:00:00.000Z"),
        now,
      }),
    ).toBe(false);

    expect(
      isResultVisible({
        visibility: "AFTER_DEADLINE",
        status: "GRADED",
        availableUntil: new Date("2026-08-10T00:00:00.000Z"),
        now,
      }),
    ).toBe(true);

    expect(
      isResultVisible({
        visibility: "MANUAL",
        status: "SUBMITTED",
        availableUntil: null,
        now,
      }),
    ).toBe(false);

    expect(
      isResultVisible({
        visibility: "MANUAL",
        status: "GRADED",
        availableUntil: null,
        now,
      }),
    ).toBe(true);
  });
});
