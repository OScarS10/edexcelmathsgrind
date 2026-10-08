import { describe, expect, it } from "vitest";
import {
  GRADE_BANDS,
  GRADE_BOUNDARIES,
  bandFor,
  ewmaAccuracy,
  gradeForPaperPct,
  predictGrade,
  wilsonInterval,
} from "@/lib/learning/grade-model";
import { estimateGrade } from "@/lib/learning/diagnosis";
import { StudentProfile, AttemptRecord } from "@/lib/profile/student-profile";

function makeAttempt(i: number, correct: boolean, date: number): AttemptRecord {
  return {
    id: `a${i}`,
    title: "Q",
    chapter: "Algebra and functions",
    difficulty: "medium",
    marks: 3,
    correct,
    timeSeconds: 60,
    hintsUsed: 0,
    workingUsed: false,
    fragile: false,
    mode: "practice",
    answerFlags: [],
    date,
  };
}

function makeProfile(attempts: AttemptRecord[]): StudentProfile {
  return {
    version: 1,
    attempts,
    errorLog: [],
    topics: {},
    misconceptions: {},
    fragileIds: [],
    explainBacks: [],
    settings: { feedbackStyle: "auto" },
  };
}

describe("grade boundaries", () => {
  it("maps marks percentages to bands at the recent Edexcel boundaries", () => {
    expect(bandFor(75)).toBe("A*");
    expect(bandFor(74)).toBe("A");
    expect(bandFor(GRADE_BOUNDARIES.A)).toBe("A");
    expect(bandFor(GRADE_BOUNDARIES.A - 0.1)).toBe("B");
    expect(bandFor(GRADE_BOUNDARIES.B)).toBe("B");
    expect(bandFor(25.9)).toBe("U");
    expect(bandFor(GRADE_BOUNDARIES.E)).toBe("E");
    expect(bandFor(0)).toBe("U");
    expect(bandFor(150)).toBe("A*");
  });

  it("keeps boundaries ordered and inside the band table", () => {
    const floors = GRADE_BANDS.filter((b) => b !== "U").map((b) => GRADE_BOUNDARIES[b]);
    for (let i = 1; i < floors.length; i++) {
      expect(floors[i]).toBeGreaterThan(floors[i - 1]);
    }
    expect(GRADE_BOUNDARIES.U).toBe(0);
  });

  it("rounds and clamps paper percentages", () => {
    expect(gradeForPaperPct(74.6)).toEqual(expect.objectContaining({ pct: 75, band: "A*" }));
    expect(gradeForPaperPct(-10)).toEqual(expect.objectContaining({ pct: 0, band: "U" }));
    expect(gradeForPaperPct(200)).toEqual(expect.objectContaining({ pct: 100, band: "A*" }));
  });
});

describe("wilsonInterval", () => {
  it("stays within [0, 100] and widens as evidence shrinks", () => {
    const strong = wilsonInterval(90, 100);
    const weak = wilsonInterval(9, 10);
    expect(strong.lo).toBeGreaterThan(weak.lo);
    expect(strong.hi).toBeLessThanOrEqual(100);
    expect(strong.lo).toBeGreaterThanOrEqual(0);
    expect(strong.hi).toBeGreaterThan(strong.lo);
  });
});

describe("ewmaAccuracy", () => {
  it("weights recent attempts more heavily", () => {
    const early = [true, true, true, false].map((c, i) => makeAttempt(i, c, i));
    const late = [true, true, true].map((c, i) => makeAttempt(10 + i, c, 100 + i));
    const allCorrect = [true, true, true, true].map((c, i) => makeAttempt(20 + i, c, 200 + i));
    expect(ewmaAccuracy([...late, ...allCorrect])).toBeGreaterThan(
      ewmaAccuracy([...early, ...late])
    );
  });
});

describe("predictGrade", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = 1_700_000_000_000;

  it("refuses to predict with too little history", () => {
    const few = makeProfile(Array.from({ length: 5 }, (_, i) => makeAttempt(i, true, now - i * DAY)));
    const pred = predictGrade(few, [], now);
    expect(pred.usable).toBe(false);
    expect(pred.reason).toBeTruthy();
    expect(pred.predictedBand).toBeNull();
    expect(pred.probabilities).toHaveLength(0);
  });

  it("produces a band, a range and probabilities that sum to ~1 with real history", () => {
    const attempts = Array.from({ length: 30 }, (_, i) =>
      makeAttempt(i, i % 4 !== 0, now - i * DAY)
    );
    const pred = predictGrade(makeProfile(attempts), [], now);
    expect(pred.usable).toBe(true);
    expect(pred.predictedBand).toBeTruthy();
    expect(pred.predictedRange).toBeTruthy();
    const total = pred.probabilities.reduce((s, p) => s + p.p, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe("estimateGrade", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = 1_700_000_000_000;

  it("returns null under ten attempts", () => {
    expect(estimateGrade(makeProfile([makeAttempt(0, true, now)]))).toBeNull();
  });

  it("maps accuracy through the boundaries and says so in the basis", () => {
    const attempts = Array.from({ length: 20 }, () => true).map((c, i) =>
      makeAttempt(i, c, now - i * DAY)
    );
    const est = estimateGrade(makeProfile(attempts));
    expect(est).not.toBeNull();
    expect(est!.band).toBe("A*");
    expect(est!.basis).toMatch(/boundar/i);
    expect(est!.basis).toMatch(/rehearsal/i);
  });
});