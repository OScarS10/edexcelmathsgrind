import { describe, expect, it } from "vitest";
import { awardMarks, markSchemeFor, summariseAward } from "@/lib/exam/mark-scheme";
import { HAND_SCHEMES } from "@/data/questions/mark-schemes";
import { EXAM_BANK, LDS_BANK, buildQuestionFromSeed } from "@/data/questions/exam-bank";
import { MarkComponent, GeneratedQuestion } from "@/types/question";

const VALID_TYPES = new Set(["M", "A", "B", "dM"]);
const allSeeds = [...EXAM_BANK, ...LDS_BANK];

function fakeQuestion(overrides: Partial<GeneratedQuestion>): GeneratedQuestion {
  return {
    id: "test",
    title: "Test",
    questionText: "?",
    questionType: "pure",
    difficulty: "medium",
    topics: [],
    marks: 3,
    examBoard: "Edexcel",
    specification: "A-Level GCE",
    year: "generated",
    source: "ai-generated",
    answer: "1",
    steps: [],
    formulaSheetAllowed: true,
    calculatorAllowed: true,
    chapter: "Algebra and functions",
    subChapter: "",
    tags: [],
    metadata: {
      solvability: { isSolvable: true, issues: [], confidence: 1, estimatedDifficulty: "medium", prerequisites: [] },
      generationModel: "test",
      createdAt: new Date(0),
    },
    ...overrides,
  };
}

describe("hand-written mark schemes", () => {
  it("covers every bank seed", () => {
    for (const seed of allSeeds) {
      expect(HAND_SCHEMES[seed.id], `missing scheme for ${seed.id}`).toBeDefined();
    }
  });

  it("sums to each seed's marks and uses only valid component types", () => {
    for (const seed of allSeeds) {
      const scheme = HAND_SCHEMES[seed.id];
      const sum = scheme.reduce((s, c) => s + c.marks, 0);
      expect(sum, `${seed.id} marks`).toBe(seed.marks);
      for (const c of scheme) {
        expect(VALID_TYPES.has(c.type), `${seed.id} type ${c.type}`).toBe(true);
        expect(c.marks).toBeGreaterThanOrEqual(1);
        expect(c.note.length).toBeGreaterThan(5);
      }
    }
  });

  it("wires bank questions through to the hand-written scheme", () => {
    const q = buildQuestionFromSeed(EXAM_BANK[0]);
    expect(q.markScheme).toEqual(HAND_SCHEMES[EXAM_BANK[0].id]);
    const awarded = awardMarks(q, { correct: true, hasWorking: true, stepVerdicts: [], hintDepth: 0 });
    expect(awarded.totalAwarded).toBe(q.marks);
    expect(awarded.totalAvailable).toBe(q.marks);
  });
});

describe("generated fallback schemes", () => {
  const shapes: Array<[number, string[]]> = [
    [1, ["A"]],
    [2, ["M", "A"]],
    [3, ["M", "M", "A"]],
    [4, ["M", "dM", "A", "A"]],
    [5, ["B", "M", "M", "A", "A"]],
    [6, ["B", "M", "M", "dM", "A", "A"]],
  ];

  for (const [marks, types] of shapes) {
    it(`follows the Edexcel ${marks}-mark shape`, () => {
      const scheme = markSchemeFor(fakeQuestion({ marks }));
      expect(scheme.map((c) => c.type)).toEqual(types);
      expect(scheme.reduce((s, c) => s + c.marks, 0)).toBe(marks);
    });
  }

  it("prefers an explicit scheme when one is attached", () => {
    const explicit: MarkComponent[] = [{ type: "B", marks: 2, note: "given" }];
    expect(markSchemeFor(fakeQuestion({ marks: 4, markScheme: explicit }))).toEqual(explicit);
  });
});

describe("awardMarks", () => {
  const q = buildQuestionFromSeed(EXAM_BANK.find((s) => s.id === "eb-015")!);

  it("awards everything for a correct answer", () => {
    const award = awardMarks(q, { correct: true, hasWorking: true, stepVerdicts: [], hintDepth: 0 });
    expect(award.totalAwarded).toBe(6);
    expect(award.components.every((c) => c.earned)).toBe(true);
  });

  it("awards nothing for a wrong answer with no working", () => {
    const award = awardMarks(q, { correct: false, hasWorking: false, stepVerdicts: [], hintDepth: 0 });
    expect(award.totalAwarded).toBe(0);
    expect(award.components.some((c) => c.type === "A" && c.earned)).toBe(false);
  });

  it("grants method marks for sound working when the final answer slipped", () => {
    const award = awardMarks(q, {
      correct: false,
      hasWorking: true,
      stepVerdicts: [
        { line: "a", verdict: "match" },
        { line: "b", verdict: "match" },
        { line: "c", verdict: "unchecked" },
      ],
      hintDepth: 0,
    });
    expect(award.totalAwarded).toBeGreaterThan(0);
    expect(award.totalAwarded).toBeLessThan(award.totalAvailable);
    expect(summariseAward(award)).toMatch(/= \d+\/6$/);
  });
});