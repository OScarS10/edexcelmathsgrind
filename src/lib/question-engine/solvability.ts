import { GeneratedQuestion, SolvabilityCheck, QuestionDifficulty } from "@/types/question";

export class SolvabilityChecker {
  checkSolvability(question: Partial<GeneratedQuestion>): SolvabilityCheck {
    const issues: string[] = [];
    let confidence = 1.0;

    if (!question.questionText || question.questionText.length < 10) {
      issues.push("Question text too short");
      confidence -= 0.2;
    }

    if (!question.answer) {
      issues.push("Missing answer");
      confidence -= 0.3;
    }

    if (!question.steps || question.steps.length === 0) {
      issues.push("No solution steps provided");
      confidence -= 0.1;
    }

    const hasMath = /\\\(|\\\[|\$|=|\\frac/.test(question.questionText || "");
    if (!hasMath && question.questionType !== "statistics") {
      confidence -= 0.05;
    }

    const isSolvable = issues.length === 0 && confidence > 0.6;

    let estimatedDifficulty: QuestionDifficulty = "medium";
    const marks = question.marks || 3;
    if (marks <= 2) estimatedDifficulty = "easy";
    if (marks >= 6) estimatedDifficulty = "hard";

    return {
      isSolvable,
      issues,
      confidence: Math.max(0, confidence),
      estimatedDifficulty,
      prerequisites: question.topics?.map((t) => t.name) || [],
    };
  }

  validateQuestion(question: Partial<GeneratedQuestion>): boolean {
    const check = this.checkSolvability(question);
    return check.isSolvable && check.confidence >= 0.7;
  }
}
