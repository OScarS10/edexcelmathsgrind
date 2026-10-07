import { create, all, MathNode } from "mathjs";

const math = create(all, { number: "number" });

function latexToMath(src: string): string {
  let s = src;
  s = s.replace(/\\left|\\right/g, "");
  s = s.replace(/\\cdot|\\times/g, "*");
  s = s.replace(/\\div/g, "/");
  s = s.replace(/\\pi/g, "pi");
  s = s.replace(/\\degree|^\^\circ|\\circ/g, "");
  s = s.replace(/\\,|\\;|\\!|\\ /g, "");
  s = s.replace(/\\mathrm\{([^}]*)\}/g, "$1");
  s = s.replace(/\\text\{([^}]*)\}/g, "$1");
  s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)");
  s = s.replace(/\^\{([^{}]*)\}/g, "^($1)");
  s = s.replace(/[{}]/g, "");
  s = s.replace(/\\ln/g, "log");
  s = s.replace(/\bne\b/g, "!=");
  return s;
}

function normalise(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\$\$?/g, "");
  s = latexToMath(s);
  s = s.replace(/\bo\b/g, "0");
  s = s.replace(/\s+/g, "");
  s = s.replace(/·|∙/g, "*");
  s = s.replace(/(\d)\s*x\s*\^\s*(\d)/g, "$1*x^$2");
  return s;
}

function tryParse(expr: string): MathNode | null {
  try {
    return math.parse(expr);
  } catch {
    return null;
  }
}

function numericValue(expr: string): number | null {
  const node = tryParse(expr);
  if (!node) return null;
  try {
    const val = node.evaluate();
    if (typeof val === "number" && Number.isFinite(val)) return val;
    return null;
  } catch {
    return null;
  }
}

function simplifyString(expr: string): string | null {
  try {
    return math.simplify(expr).toString({ parenthesis: "all" });
  } catch {
    return null;
  }
}

function equivalent(a: string, b: string): boolean {
  if (a === b) return true;

  const na = numericValue(a);
  const nb = numericValue(b);
  if (na !== null && nb !== null) {
    const tol = Math.max(1e-9, Math.abs(nb) * 1e-6);
    return Math.abs(na - nb) <= tol;
  }

  const sa = simplifyString(a);
  const sb = simplifyString(b);
  if (sa && sb && sa === sb) return true;

  const diff = simplifyString(`(${a})-(${b})`);
  if (diff === "0") return true;

  return false;
}

function splitAnswers(s: string): string[] {
  return s
    .split(/,|;| or | and |\//)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function matchSet(userParts: string[], answerParts: string[]): boolean {
  if (userParts.length !== answerParts.length) {
    if (answerParts.length === 1 && userParts.length >= 1) {
      return equivalent(userParts.join(","), answerParts[0]);
    }
    return false;
  }
  const used = new Set<number>();
  for (const u of userParts) {
    let found = -1;
    for (let i = 0; i < answerParts.length; i++) {
      if (used.has(i)) continue;
      if (equivalent(normalise(u), normalise(answerParts[i]))) {
        found = i;
        break;
      }
    }
    if (found === -1) return false;
    used.add(found);
  }
  return true;
}

const TEXT_SYNONYMS: Array<[RegExp, string]> = [
  [/^(maximum|max)\b/, "maximum"],
  [/^(minimum|min)\b/, "minimum"],
];

function normaliseText(s: string): string {
  let t = s.toLowerCase().trim();
  t = t.replace(/[^\w\s./^()-]/g, "");
  t = t.replace(/\s+/g, " ");
  for (const [re, rep] of TEXT_SYNONYMS) t = t.replace(re, rep);
  return t;
}

function textSimilarity(user: string, answer: string): number {
  const u = new Set(normaliseText(user).split(" ").filter((w) => w.length > 1));
  const a = new Set(normaliseText(answer).split(" ").filter((w) => w.length > 1));
  if (u.size === 0 || a.size === 0) return 0;
  let overlap = 0;
  for (const w of u) if (a.has(w)) overlap++;
  return overlap / Math.max(u.size, a.size);
}

export interface AnswerCheckResult {
  correct: boolean;
  normalisedUser: string;
  normalisedAnswer: string;
  method: "numeric" | "symbolic" | "set" | "text" | "exact";
}

function rhsOfAssignment(s: string): string | null {
  const m = s.match(/^[a-zA-Z]\s*=\s*(.+)$/);
  return m ? m[1] : null;
}

export function checkAnswer(userInput: string, correctAnswer: string): AnswerCheckResult {
  const rawUser = (userInput || "").trim();
  const rawAnswer = (correctAnswer || "").trim();

  const normalisedAnswer = normalise(rawAnswer);
  const normalisedUser = normalise(rawUser);

  if (normalisedUser === normalisedAnswer) {
    return { correct: true, normalisedUser, normalisedAnswer, method: "exact" };
  }

  // Postel: "12" satisfies an answer given as "x = 12".
  const answerRhs = rhsOfAssignment(normalisedAnswer);
  if (answerRhs && equivalent(normalisedUser, answerRhs)) {
    return { correct: true, normalisedUser, normalisedAnswer, method: "exact" };
  }
  const userRhs = rhsOfAssignment(normalisedUser);
  if (userRhs && equivalent(userRhs, normalisedAnswer)) {
    return { correct: true, normalisedUser, normalisedAnswer, method: "exact" };
  }

  const answerParts = splitAnswers(normalisedAnswer);
  const userParts = splitAnswers(normalisedUser);

  if (
    answerParts.length > 1 ||
    (answerParts.length === 1 && userParts.length > 1 && /[,(]/.test(answerParts[0]) === false)
  ) {
    if (matchSet(userParts, answerParts)) {
      return { correct: true, normalisedUser, normalisedAnswer, method: "set" };
    }
  }

  if (answerParts.length > 1 && userParts.length === 1) {
    if (matchSet(userParts, answerParts)) {
      return { correct: true, normalisedUser, normalisedAnswer, method: "set" };
    }
  }

  const bothNumeric =
    numericValue(normalisedUser) !== null && numericValue(normalisedAnswer) !== null;
  if (bothNumeric) {
    if (equivalent(normalisedUser, normalisedAnswer)) {
      return { correct: true, normalisedUser, normalisedAnswer, method: "numeric" };
    }
    return { correct: false, normalisedUser, normalisedAnswer, method: "numeric" };
  }

  if (equivalent(normalisedUser, normalisedAnswer)) {
    return { correct: true, normalisedUser, normalisedAnswer, method: "symbolic" };
  }

  const plainAnswer = rawAnswer.replace(/\$|\(|\)/g, "");
  if (textSimilarity(rawUser, plainAnswer) >= 0.7) {
    return { correct: true, normalisedUser, normalisedAnswer, method: "text" };
  }
  const plainUser = rawUser.replace(/\$|\(|\)/g, "");
  if (textSimilarity(plainUser, plainAnswer) >= 0.7) {
    return { correct: true, normalisedUser, normalisedAnswer, method: "text" };
  }

  return { correct: false, normalisedUser, normalisedAnswer, method: "text" };
}
