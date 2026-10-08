import { GeneratedQuestion, MarkComponent } from "@/types/question";

export interface StepVerdict {
  line: string;
  verdict: "match" | "final" | "unchecked" | "unclear";
  note?: string;
}

export interface MarkAward {
  totalAwarded: number;
  totalAvailable: number;
  components: Array<MarkComponent & { earned: boolean; reason: string }>;
}

/**
 * Mark scheme for a question. Bank seeds carry a hand-written scheme
 * (see src/data/questions/mark-schemes.ts); otherwise one is synthesised the
 * way Edexcel papers are laid out - method marks shaped into common mark
 * patterns, and an accuracy mark for the final answer.
 */
export function markSchemeFor(question: GeneratedQuestion): MarkComponent[] {
  if (question.markScheme?.length) return question.markScheme;

  const marks = Math.max(1, question.marks);
  const stepNotes =
    question.steps?.map((s, i) => `Method — correct working in step ${i + 1}`) ??
    [];

  const take = (type: MarkComponent["type"], note: string): MarkComponent => ({
    type,
    marks: 1,
    note,
  });

  if (marks === 1) {
    return [take("A", "Accuracy — correct final answer")];
  }

  // Edexcel paper mark-schemes follow well-worn shapes by mark total.
  const shape: Array<MarkComponent["type"]> =
    marks === 2
      ? ["M", "A"]
      : marks === 3
        ? ["M", "M", "A"]
        : marks === 4
          ? ["M", "dM", "A", "A"]
          : marks === 5
            ? ["B", "M", "M", "A", "A"]
            : ["B", "M", "M", "dM", "A", "A"];

  let step = 0;
  return shape.map((type) => {
    if (type === "A") {
      return take("A", "Accuracy — correct final answer");
    }
    if (type === "B") {
      return take("B", "Independent — correct statement or value, no working needed");
    }
    if (type === "dM") {
      return take("dM", "Dependent method — correct step following your working");
    }
    return take("M", stepNotes[step++] ?? "Method — a correct mathematical step");
  });
}

export interface AwardInput {
  correct: boolean;
  hasWorking: boolean;
  stepVerdicts: StepVerdict[];
  hintDepth: number;
}

/**
 * Examiner-style awarding (M/A/B). Wrong answers still earn method marks
 * when working is present, and a follow-through mark when the method was
 * sound but the final answer slipped — mirroring real Edexcel scripts.
 */
export function awardMarks(question: GeneratedQuestion, input: AwardInput): MarkAward {
  const scheme = markSchemeFor(question);
  const { correct, hasWorking, stepVerdicts } = input;

  const matchedSteps = stepVerdicts.filter((v) => v.verdict === "match").length;
  const plausibleLines = stepVerdicts.filter(
    (v) => v.verdict === "match" || v.verdict === "unchecked"
  ).length;

  const components = scheme.map((c) => {
    if (correct) {
      return {
        ...c,
        earned: true,
        reason:
          input.hintDepth > 0
            ? "correct (with hints used)"
            : "correct",
      };
    }

    if (c.type === "A") {
      return { ...c, earned: false, reason: "final answer not correct" };
    }

    if (c.type === "B") {
      const followThrough = hasWorking && matchedSteps >= 2;
      return {
        ...c,
        earned: followThrough,
        reason: followThrough ? "follow-through (method sound, answer slip)" : "no follow-through",
      };
    }

    // M / dM: earnable when working is actually present and plausible.
    if (!hasWorking) {
      return { ...c, earned: false, reason: "no working shown" };
    }
    const earned = plausibleLines > 0;
    return {
      ...c,
      earned,
      reason: earned ? "method attempted" : "working present but no valid method detected",
    };
  });

  const totalAwarded = components.reduce((s, c) => s + (c.earned ? c.marks : 0), 0);
  const totalAvailable = components.reduce((s, c) => s + c.marks, 0);

  return { totalAwarded, totalAvailable, components };
}

/** Compact "M2 A1 = 3/4" style line for the UI. */
export function summariseAward(award: MarkAward): string {
  const byType = new Map<string, { earned: number; total: number }>();
  for (const c of award.components) {
    const cur = byType.get(c.type) || { earned: 0, total: 0 };
    cur.total += c.marks;
    if (c.earned) cur.earned += c.marks;
    byType.set(c.type, cur);
  }
  const order = ["M", "dM", "B", "A"];
  const parts: string[] = [];
  for (const t of order) {
    const v = byType.get(t);
    if (v) parts.push(`${t}${v.earned}/${v.total}`);
  }
  return parts.join(" ") + ` = ${award.totalAwarded}/${award.totalAvailable}`;
}
