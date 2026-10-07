import { NextRequest, NextResponse } from "next/server";
import { checkAnswer } from "@/lib/solvers/answer-checker";
import { sympyEquivalent, sympyConfigured } from "@/lib/solvers/sympy-client";

interface StepLine {
  line: string;
  verdict: "match" | "final" | "unchecked" | "unclear";
  note?: string;
}

function mathsish(line: string): boolean {
  return /[\d^*/]|\\frac|=/.test(line);
}

function checkLines(
  working: string[],
  reference: Array<{ explanation: string; working?: string }>,
  finalAnswer: string
): StepLine[] {
  const refs = reference.map((r) => r.working).filter(Boolean) as string[];
  return working.map((raw) => {
    const line = raw.trim();
    if (!line) return { line, verdict: "unchecked" as const };

    const asFinal = checkAnswer(line, finalAnswer);
    if (asFinal.correct) return { line, verdict: "final" as const, note: "matches your final answer" };

    for (let i = 0; i < refs.length; i++) {
      const m = checkAnswer(line, refs[i]);
      if (m.correct) return { line, verdict: "match" as const, note: `matches step ${i + 1}` };
    }

    if (mathsish(line)) {
      return { line, verdict: "unchecked" as const, note: "expression not in the reference route" };
    }
    return { line, verdict: "unclear" as const, note: "couldn't parse this line" };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAnswer, correctAnswer, working, referenceSteps } = body;
    if (typeof userAnswer !== "string" || typeof correctAnswer !== "string") {
      return NextResponse.json(
        { error: "userAnswer and correctAnswer must be strings" },
        { status: 400 }
      );
    }

    let result = checkAnswer(userAnswer, correctAnswer);
    let checker: "mathjs" | "sympy" = "mathjs";

    // Wrong-by-mathjs gets a SymPy second opinion before we mark it down.
    if (!result.correct) {
      const sympy = await sympyEquivalent(result.normalisedUser, result.normalisedAnswer);
      if (sympy === true) {
        result = { ...result, correct: true, method: "symbolic" };
        checker = "sympy";
      }
    }

    const steps = Array.isArray(working)
      ? checkLines(
          working.slice(0, 8).map((w: unknown) => String(w)),
          Array.isArray(referenceSteps) ? referenceSteps : [],
          String(correctAnswer)
        )
      : undefined;

    return NextResponse.json({ ...result, steps, checker, sympyConfigured: sympyConfigured() });
  } catch {
    return NextResponse.json(
      { error: "Failed to check answer" },
      { status: 500 }
    );
  }
}
