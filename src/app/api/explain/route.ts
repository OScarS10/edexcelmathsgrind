import { NextRequest, NextResponse } from "next/server";
import { ExplanationEngine } from "@/lib/explanations/explanation-engine";
import { EXAM_QUESTIONS } from "@/data/questions/exam-bank";
import { TMUA_QUESTIONS } from "@/data/questions/tmua-bank";
import { GeneratedQuestion } from "@/types/question";

const ALL_QUESTIONS: GeneratedQuestion[] = [...EXAM_QUESTIONS, ...TMUA_QUESTIONS];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, question: questionPayload, userAnswer, correct, style, prereqGaps } = body;

    let question: GeneratedQuestion | undefined;

    if (questionPayload && typeof questionPayload === "object") {
      question = questionPayload as GeneratedQuestion;
    } else if (questionId) {
      question = ALL_QUESTIONS.find((q) => q.id === questionId);
    }

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const explanationStyle =
      style === "terse" || style === "partial" || style === "full"
        ? style
        : "full";
    const gaps = Array.isArray(prereqGaps)
      ? prereqGaps.filter((g): g is string => typeof g === "string")
      : [];

    const engine = new ExplanationEngine();
    const explanation = correct
      ? engine.explainCorrectAnswer(question, { style: explanationStyle })
      : engine.explainWrongAnswer(question, String(userAnswer || ""), {
          style: explanationStyle,
          prereqGaps: gaps,
        });

    return NextResponse.json({ explanation, success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
