import { GeneratedQuestion, PrecisionSpec } from "@/types/question";

const COMMAND_PATTERNS: Array<{ word: string; pattern: RegExp }> = [
  { word: "show that", pattern: /\bshow\s+that\b/i },
  { word: "hence", pattern: /\bhence\b/i },
  { word: "prove", pattern: /\bprove\b/i },
  { word: "deduce", pattern: /\bdeduce\b/i },
  { word: "justify", pattern: /\bjustify\b/i },
  { word: "explain why", pattern: /\bexplain\s+why\b/i },
  { word: "interpret", pattern: /\binterpret\b/i },
  { word: "comment on", pattern: /\bcomment\s+on\b/i },
  { word: "state", pattern: /^\s*state\b|\bstate\s+(the|your)\b/i },
  { word: "write down", pattern: /\bwrite\s+down\b/i },
  { word: "given that", pattern: /\bgiven\s+that\b/i },
  { word: "exact value", pattern: /\bexact\s+(value|form|answer)\b/i },
  { word: "show your answers", pattern: /\bshow\s+your\s+answer/i },
  { word: "in degrees", pattern: /\bin\s+degrees\b/i },
  { word: "find", pattern: /\bfind\b/i },
  { word: "solve", pattern: /\bsolve\b/i },
  { word: "determine", pattern: /\bdetermine\b/i },
  { word: "calculate", pattern: /\bcalculate\b/i },
  { word: "sketch", pattern: /\bsketch\b/i },
  { word: "describe", pattern: /\bdescribe\b/i },
];

/** High-signal command words shown as badges (Miller: cap at what matters). */
const BADGE_WORDS = new Set([
  "show that",
  "hence",
  "prove",
  "deduce",
  "justify",
  "exact value",
  "interpret",
  "comment on",
  "given that",
]);

export function extractCommandWords(questionText: string): string[] {
  const found: string[] = [];
  for (const { word, pattern } of COMMAND_PATTERNS) {
    if (pattern.test(questionText)) found.push(word);
  }
  return found;
}

export function badgeCommandWords(question: GeneratedQuestion): string[] {
  const words = question.commandWords ?? extractCommandWords(question.questionText);
  const badges = words.filter((w) => BADGE_WORDS.has(w));
  return badges.slice(0, 4);
}

export function extractPrecision(questionText: string, answer: string): PrecisionSpec {
  const spec: PrecisionSpec = {};
  const text = questionText.toLowerCase();

  if (/\bexact(ly)?\b/.test(text)) spec.exact = true;

  const sf = text.match(/(\d+)\s*(?:significant figures|s\.?f\.?)/);
  if (sf) spec.sf = parseInt(sf[1], 10);
  const dp = text.match(/(\d+)\s*(?:decimal places|d\.?p\.?)/);
  if (dp) spec.dp = parseInt(dp[1], 10);

  const units = String(answer).match(/\\mathrm\{([^}]+)\}/);
  if (units) spec.units = units[1].replace(/\\,?/g, "").trim();

  return spec;
}

function hasLongDecimal(s: string): boolean {
  return /-?\d+\.\d{3,}/.test(s);
}

function numericParts(s: string): number[] {
  const m = s.match(/-?\d+\.?\d*/g) || [];
  return m.map(parseFloat).filter((n) => Number.isFinite(n));
}

function decimalPlaces(s: string): number {
  const m = s.match(/-?\d+\.(\d+)/);
  return m ? m[1].length : 0;
}

/**
 * Examiner-style precision feedback. Never changes the maths verdict —
 * wrong precision is a presentation warning, exactly as on a mark scheme.
 */
export function precisionFlags(
  question: GeneratedQuestion,
  userAnswer: string
): string[] {
  const flags: string[] = [];
  const spec =
    question.precision ??
    extractPrecision(question.questionText, String(question.answer));
  const user = userAnswer.trim();
  const answerStr = String(question.answer);

  if (spec.exact && hasLongDecimal(user) && !hasLongDecimal(answerStr)) {
    flags.push(
      "The question asks for an exact value — give a fraction or surd, not a decimal."
    );
  }

  if (spec.units && !user.toLowerCase().includes(spec.units.toLowerCase())) {
    flags.push(`Your answer needs the unit ${spec.units}.`);
  }

  if (spec.sf) {
    for (const n of numericParts(user)) {
      if (decimalPlaces(user) > spec.sf && Math.abs(n) >= 1) {
        flags.push(`Give your answer to ${spec.sf} significant figures.`);
        break;
      }
    }
  }

  if (spec.dp) {
    const dp = decimalPlaces(user);
    if (dp > spec.dp) {
      flags.push(`Give your answer to ${spec.dp} decimal place${spec.dp > 1 ? "s" : ""}.`);
    }
  }

  if (/\bhence\b/i.test(question.questionText) && !user.trim()) {
    flags.push("'Hence' means use your previous result — check you carried it forward.");
  }

  return flags.slice(0, 3);
}
