import { describe, expect, it } from "vitest";
import { QuestionGenerator } from "@/lib/nn/question-generator";
import { markSchemeFor } from "@/lib/exam/mark-scheme";
import { topicLevelForChapter } from "@/data/chapters/edexcel-chapters";

describe("QuestionGenerator", () => {
  const generator = new QuestionGenerator();

  it("generates the requested number of questions with real answers", () => {
    const questions = generator.generateQuestions({ difficulty: "medium", count: 5 });
    expect(questions.length).toBe(5);
    for (const q of questions) {
      expect(q.id).toBeTruthy();
      expect(q.questionText.length).toBeGreaterThan(10);
      expect(String(q.answer).length).toBeGreaterThan(0);
      expect(q.marks).toBeGreaterThanOrEqual(1);
      expect((q.steps ?? []).length).toBeGreaterThan(0);
      expect(q.metadata.solvability.isSolvable).toBe(true);
    }
  });

  it("gives every generated question a scheme whose marks add up", () => {
    const questions = generator.generateQuestions({ difficulty: "hard", count: 8 });
    for (const q of questions) {
      const scheme = markSchemeFor(q);
      const sum = scheme.reduce((s, c) => s + c.marks, 0);
      expect(sum, `${q.id} scheme sum`).toBe(q.marks);
      expect(scheme[scheme.length - 1].type).toBe("A");
    }
  });

  it("respects the level filter", () => {
    const year1 = generator.generateQuestions({ difficulty: "medium", level: "year1", count: 6 });
    for (const q of year1) {
      expect(topicLevelForChapter(q.chapter)).toBe("year1");
    }
    const year2 = generator.generateQuestions({ difficulty: "medium", level: "year2", count: 6 });
    for (const q of year2) {
      expect(topicLevelForChapter(q.chapter)).toBe("year2");
    }
  });
});