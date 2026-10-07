import { GeneratedQuestion } from "@/types/question";

export type ExplanationStyle = "full" | "partial" | "terse";

export interface ExplanationResult {
  headline: string;
  explanation: string;
  steps: Array<{ title: string; content: string }>;
  commonMistakes: string[];
  likelyMisconception?: string;
  relatedConcepts: string[];
  tag?: string;
  prerequisiteNote?: string;
}

const CHAPTER_MISTAKES: Record<string, string[]> = {
  "Algebra and functions": [
    "Sign errors when expanding brackets",
    "Forgetting to factor completely (missing a common factor)",
    "Mixing up the roots with the factors (sign flip)",
    "Applying the quadratic formula with the wrong a, b, c",
  ],
  Differentiation: [
    "Incorrect power rule application (forgetting to multiply by the power)",
    "Forgetting the chain rule inner derivative",
    "Not differentiating constant terms to 0",
  ],
  Integration: [
    "Forgetting the constant of integration $+c$",
    "Not increasing the power before dividing",
    "Applying limits in the wrong order (upper − lower)",
  ],
  Trigonometry: [
    "Missing the second solution in the given range",
    "Mixing up degrees and radians",
    "Using the wrong quadrant for the sign",
  ],
  Probability: [
    "Counting outcomes that are not equally likely",
    "Forgetting 'without replacement' changes the denominator",
    "Double counting outcomes",
  ],
  "Sequences and series": [
    "Using the arithmetic formula for a geometric sequence (or vice versa)",
    "Off-by-one errors in $n$ (the power is $n-1$, not $n$)",
    "Arithmetic slips with negative common differences",
  ],
  "Exponentials and logarithms": [
    "Confusing log laws with index laws",
    "Forgetting to check the argument of a log is positive",
    "Not substituting $u = e^x$ to reveal the quadratic",
  ],
  Kinematics: [
    "Using the wrong sign for acceleration (deceleration)",
    "Forgetting $\\frac{1}{2}at^2$ in the distance formula",
    "Mixing up distance and displacement",
  ],
  "Forces and Newton's laws": [
    "Forgetting to include the weight of the object itself",
    "Using mass instead of weight (or vice versa)",
    "Not resolving forces in the direction of motion",
  ],
  Moments: [
    "Taking moments about the wrong point",
    "Missing a force that passes through the pivot (its moment is 0)",
    "Clockwise vs anticlockwise sign errors",
  ],
  Proof: [
    "Showing an example instead of a general proof",
    "Assuming what you are trying to prove",
    "Skipping the inductive step in induction",
  ],
  "Coordinate geometry": [
    "Using $x_1 - x_2$ inconsistently in the gradient (sign flip)",
    "Forgetting to square the radius in the circle equation",
    "Mixing up $(x-a)$ with $(x+a)$",
  ],
  "Numerical methods": [
    "Rounding too early in iterations",
    "Wrong rearrangement of the equation for iteration",
    "Wrong number of strips or strip width",
  ],
  "Statistical distributions": [
    "Forgetting to standardise before using tables",
    "Using $P(X < z)$ when you need the upper tail",
    "Mixing up variance $\\sigma^2$ with standard deviation $\\sigma$",
  ],
  "Data presentation and interpretation": [
    "Dividing by $n-1$ instead of $n$ (or vice versa)",
    "Wrong quartile positions in a small data set",
    "Interpreting the chart incorrectly",
  ],
  "Statistical sampling": [
    "Sample sizes not proportional to group sizes",
    "Confusing sampling frame with population",
  ],
  "Hypothesis testing": [
    "Forgetting $H_0$ must contain equality",
    "Using a two-tailed test when a one-tailed test is needed",
    "Comparing the p-value with the wrong significance level",
  ],
};

function detectMisconception(
  question: GeneratedQuestion,
  userAnswer: string
): string | undefined {
  const user = userAnswer.trim().toLowerCase();
  const answerStr = String(question.answer);
  const correct = answerStr.toLowerCase();

  if (
    question.chapter === "Integration" &&
    answerStr.includes("+ c") &&
    !user.includes("c")
  ) {
    return "Your answer looks right but is missing the constant of integration $+c$.";
  }

  if (question.chapter === "Trigonometry" && answerStr.includes(",")) {
    const count = (user.match(/-?\d+(\.\d+)?/g) || []).length;
    const correctCount = (answerStr.match(/-?\d+(\.\d+)?/g) || []).length;
    if (count === 1 && correctCount > 1) {
      return "You found the principal value but missed the other solution(s) in the given range.";
    }
  }

  if (/^\$?x\s*=\s*/.test(answerStr) && /^\$?x\s*=\s*/.test(user)) {
    const userNum = parseFloat(user.replace(/^\$?x\s*=\s*/, ""));
    const answerNum = parseFloat(correct.replace(/^\$?x\s*=\s*/, ""));
    if (!isNaN(userNum) && !isNaN(answerNum) && Math.abs(userNum + answerNum) < 1e-9) {
      return "Your answer is the negative of the correct value — check your signs carefully.";
    }
  }

  if (
    question.difficulty === "easy" &&
    question.marks <= 3 &&
    user.length < String(question.answer).length / 3
  ) {
    return "Your answer looks incomplete — check the question is asking for everything you have given.";
  }

  return undefined;
}

export class ExplanationEngine {
  explainWrongAnswer(
    question: GeneratedQuestion,
    userAnswer: string,
    opts?: { style?: ExplanationStyle; prereqGaps?: string[] }
  ): ExplanationResult {
    const style = opts?.style ?? "full";
    const prereqGaps = opts?.prereqGaps ?? [];

    const mistakes = CHAPTER_MISTAKES[question.chapter] || [
      "Arithmetic errors under time pressure",
      "Misreading the question requirements",
      "Not showing enough working to secure method marks",
    ];

    const misconception = detectMisconception(question, userAnswer);
    const tag = misconception ?? `${question.chapter}: method/accuracy slip`;
    const prereqNote =
      prereqGaps.length > 0
        ? `Foundational gap: this question leans on ${prereqGaps.slice(0, 2).join(" and ")} — a quick refresh there will pay off before pushing on.`
        : undefined;

    if (style === "terse") {
      const firstStep = question.steps?.[0];
      return {
        headline: misconception
          ? "One thing went wrong"
          : "Not this time — check your first line",
        explanation: misconception
          ? misconception
          : firstStep
            ? `Start from: ${firstStep.working || firstStep.explanation}`
            : `Correct answer: ${question.answer}`,
        steps: [],
        commonMistakes: [],
        likelyMisconception: misconception,
        relatedConcepts: question.tags,
        tag,
        prerequisiteNote: prereqNote,
      };
    }

    const steps = (question.steps || []).map((s, i) => ({
      title: `Step ${i + 1}`,
      content: s.working ? `${s.explanation} ${s.working}` : s.explanation,
    }));

    if (style === "partial") {
      return {
        headline: misconception ? "Here's what likely went wrong" : "Method first",
        explanation:
          misconception ??
          question.method ??
          `The correct answer is ${question.answer}. Reconcile your first line with step 1.`,
        steps: steps.slice(0, 2),
        commonMistakes: [],
        likelyMisconception: misconception,
        relatedConcepts: question.tags,
        tag,
        prerequisiteNote: prereqNote,
      };
    }

    return {
      headline: misconception
        ? "Here's what likely went wrong"
        : "Let's work through it together",
      explanation:
        `The correct answer is ${question.answer}. ` +
        (question.method ? `${question.method} ` : "") +
        `Compare your working with the steps below and look for the first point where they differ — that's where the misunderstanding is.`,
      steps,
      commonMistakes: mistakes.slice(0, 4),
      likelyMisconception: misconception,
      relatedConcepts: question.tags,
      tag,
      prerequisiteNote: prereqNote,
    };
  }

  explainCorrectAnswer(
    question: GeneratedQuestion,
    opts?: { style?: ExplanationStyle }
  ): ExplanationResult {
    const style = opts?.style ?? "full";
    const steps = (question.steps || []).map((s, i) => ({
      title: `Step ${i + 1}`,
      content: s.working ? `${s.explanation} ${s.working}` : s.explanation,
    }));
    return {
      headline: "Correct — here's the full solution",
      explanation: question.method || "Well done!",
      steps: style === "terse" ? [] : style === "partial" ? steps.slice(0, 2) : steps,
      commonMistakes: [],
      relatedConcepts: question.tags,
    };
  }
}
