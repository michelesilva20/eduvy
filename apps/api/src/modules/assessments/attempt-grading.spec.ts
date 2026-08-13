import {
  calculateAttemptTotals,
  canStartAttempt,
  gradeObjectiveAnswer,
  isAttemptExpired,
  totalsFromAwardedPoints,
} from "./attempt-grading";

describe("attempt-grading", () => {
  const single = {
    id: "q1",
    type: "SINGLE_CHOICE" as const,
    points: 2,
    options: [
      { id: "a", isCorrect: false },
      { id: "b", isCorrect: true },
    ],
  };

  const multi = {
    id: "q2",
    type: "MULTIPLE_CHOICE" as const,
    points: 3,
    options: [
      { id: "a", isCorrect: true },
      { id: "b", isCorrect: false },
      { id: "c", isCorrect: true },
    ],
  };

  it("grades single choice", () => {
    expect(gradeObjectiveAnswer(single, { selectedOptionIds: ["b"] })).toEqual({
      isCorrect: true,
      pointsAwarded: 2,
      pendingManual: false,
    });
    expect(gradeObjectiveAnswer(single, { selectedOptionIds: ["a"] }).isCorrect).toBe(
      false,
    );
  });

  it("requires exact set for multiple choice", () => {
    expect(
      gradeObjectiveAnswer(multi, { selectedOptionIds: ["a", "c"] }).isCorrect,
    ).toBe(true);
    expect(
      gradeObjectiveAnswer(multi, { selectedOptionIds: ["a"] }).isCorrect,
    ).toBe(false);
    expect(
      gradeObjectiveAnswer(multi, { selectedOptionIds: ["a", "b", "c"] }).isCorrect,
    ).toBe(false);
  });

  it("keeps short text pending manual", () => {
    expect(
      gradeObjectiveAnswer(
        { id: "q3", type: "SHORT_TEXT", points: 1, options: null },
        { textAnswer: "hello" },
      ),
    ).toEqual({ isCorrect: null, pointsAwarded: null, pendingManual: true });
  });

  it("recalculates totals after manual short text grading", () => {
    const pending = totalsFromAwardedPoints(
      [
        { id: "q1", points: 2, type: "SINGLE_CHOICE" },
        { id: "q2", points: 3, type: "SHORT_TEXT" },
      ],
      [
        { questionId: "q1", isCorrect: true, pointsAwarded: 2 },
        { questionId: "q2", isCorrect: null, pointsAwarded: null },
      ],
    );
    expect(pending.pendingManualGrade).toBe(true);
    expect(pending.score).toBe(2);

    const graded = totalsFromAwardedPoints(
      [
        { id: "q1", points: 2, type: "SINGLE_CHOICE" },
        { id: "q2", points: 3, type: "SHORT_TEXT" },
      ],
      [
        { questionId: "q1", isCorrect: true, pointsAwarded: 2 },
        { questionId: "q2", isCorrect: true, pointsAwarded: 3 },
      ],
    );
    expect(graded.pendingManualGrade).toBe(false);
    expect(graded.score).toBe(5);
    expect(graded.scorePercentage).toBe(100);
  });

  it("calculates totals and percentage", () => {
    const answers = new Map([
      ["q1", { selectedOptionIds: ["b"] }],
      ["q2", { selectedOptionIds: ["a"] }],
    ]);
    const totals = calculateAttemptTotals([single, multi], answers);
    expect(totals.score).toBe(2);
    expect(totals.maxScore).toBe(5);
    expect(totals.scorePercentage).toBe(40);
    expect(totals.pendingManualGrade).toBe(false);
  });

  it("detects expiration from server time", () => {
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 60_000);
    expect(isAttemptExpired(past)).toBe(true);
    expect(isAttemptExpired(future)).toBe(false);
    expect(isAttemptExpired(null)).toBe(false);
  });

  it("gates start attempt by availability and max attempts", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    expect(
      canStartAttempt({
        published: true,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: 2,
        usedCount: 2,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);

    expect(
      canStartAttempt({
        published: true,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: 2,
        usedCount: 2,
        hasInProgress: true,
        now,
      }).ok,
    ).toBe(true);

    expect(
      canStartAttempt({
        published: false,
        availableFrom: null,
        availableUntil: null,
        maxAttempts: null,
        usedCount: 0,
        hasInProgress: false,
        now,
      }).ok,
    ).toBe(false);
  });
});
