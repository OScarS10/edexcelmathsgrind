import { NextRequest, NextResponse } from "next/server";
import { QuestionGenerator } from "@/lib/nn/question-generator";
import { EXAM_QUESTIONS } from "@/data/questions/exam-bank";
import { topicLevelForChapter } from "@/data/chapters/edexcel-chapters";
import { GeneratedQuestion, Level, QuestionDifficulty, QuestionType } from "@/types/question";

function matchesFilters(q: GeneratedQuestion, params: {
  difficulty?: string;
  questionType?: string;
  chapter?: string;
  level?: string;
}): boolean {
  if (params.difficulty && params.difficulty !== "any" && q.difficulty !== params.difficulty) {
    return false;
  }
  if (params.level && params.level !== "all") {
    if (topicLevelForChapter(q.chapter) !== params.level) return false;
  }
  if (params.chapter && params.chapter !== "all") {
    const ch = params.chapter.toLowerCase();
    if (
      !q.chapter.toLowerCase().includes(ch) &&
      !ch.includes(q.chapter.toLowerCase())
    ) {
      return false;
    }
  }
  if (params.questionType && params.questionType !== "any") {
    const allowed: Record<string, string[]> = {
      pure: ["pure", "algebra", "calculus", "trigonometry", "geometry"],
      algebra: ["pure", "algebra"],
      calculus: ["pure", "calculus"],
      trigonometry: ["pure", "trigonometry"],
      statistics: ["statistics"],
      mechanics: ["mechanics"],
    };
    const ok = allowed[params.questionType];
    if (ok && !ok.includes(q.questionType)) return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params = {
    difficulty: sp.get("difficulty") || undefined,
    questionType: sp.get("questionType") || undefined,
    chapter: sp.get("chapter") || undefined,
    level: sp.get("level") || undefined,
  };
  const count = Math.min(parseInt(sp.get("count") || "6"), 12);

  const bank = EXAM_QUESTIONS.filter((q) => matchesFilters(q, params));

  for (let i = bank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bank[i], bank[j]] = [bank[j], bank[i]];
  }

  let questions = bank.slice(0, count);

  if (questions.length < count) {
    const generator = new QuestionGenerator();
    const remaining = count - questions.length;
    try {
      const generated = generator.generateQuestions({
        difficulty: (params.difficulty as QuestionDifficulty) || "medium",
        questionType: params.questionType
          ? (params.questionType as QuestionType)
          : undefined,
        chapter: params.chapter,
        level: (params.level === "year1" || params.level === "year2"
          ? params.level
          : undefined) as Level | undefined,
        count: remaining,
      });
      questions = [...questions, ...generated];
    } catch {
      // keep bank-only results if generation fails
    }
  }

  return NextResponse.json({
    questions,
    count: questions.length,
    source: "edexcel-exam-bank + generator",
    params,
  });
}
