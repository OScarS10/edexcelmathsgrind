import { GeneratedQuestion, QuestionDifficulty, QuestionType } from "@/types/question";
import { ALL_CHAPTERS, findTopicByChapter } from "@/data/chapters/edexcel-chapters";
import { specForChapter, defaultSpecPoint } from "@/data/chapters/spec-map";
import { extractCommandWords, extractPrecision } from "@/lib/exam/command-words";
import { markSchemeFor } from "@/lib/exam/mark-scheme";
import { SolvabilityNN } from "@/lib/nn/neural-network";

export interface GenerationParams {
  difficulty: QuestionDifficulty;
  questionType?: QuestionType;
  chapter?: string;
  marks?: number;
  count?: number;
}

function moduleToType(module: string): QuestionType {
  if (module === "stats") return "statistics";
  if (module === "mechanics") return "mechanics";
  return "pure";
}

interface TemplateContext {
  difficulty: QuestionDifficulty;
  marks: number;
}

export type VerifyKind =
  | "equivalent"
  | "solve"
  | "solve_domain"
  | "inequality"
  | "derivative"
  | "integral_indefinite"
  | "integral_definite"
  | "numeric"
  | "expand_coeffs"
  | "stationary"
  | "stats_mean_sd"
  | "stats_iqr"
  | "dice_sum"
  | "vector_on_line"
  | "text";

export interface VerifySpec {
  kind: VerifyKind;
  id?: string;
  [key: string]: unknown;
}

interface QuestionTemplate {
  id: string;
  chapter: string;
  build: (ctx: TemplateContext) => {
    title: string;
    questionText: string;
    answer: string;
    method: string;
    steps: { id: string; explanation: string; working?: string }[];
    tags: string[];
    marks: number;
    verify: VerifySpec[];
  };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

const TEMPLATES: QuestionTemplate[] = [
  {
    id: "quad-factorise",
    chapter: "Algebra and functions",
    build: (ctx) => {
      let r1 = 0;
      let r2 = 0;
      let b = 0;
      let c = 0;
      do {
        r1 = randInt(-6, 6);
        r2 = randInt(-6, 6);
        b = r1 + r2;
        c = r1 * r2;
      } while (b === 0 || c === 0);
      const x1 = Math.min(r1, r2);
      const x2 = Math.max(r1, r2);
      const sign = (n: number) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`);
      return {
        title: "Quadratic factorisation",
        questionText: `Factorise $x^2 ${sign(b)}x ${sign(c)}$ completely.`,
        answer: `$(x${r1 >= 0 ? "+" : "-"}${Math.abs(r1)})(x${r2 >= 0 ? "+" : "-"}${Math.abs(r2)})$`,
        method: "Find two numbers that multiply to the constant term and add to the coefficient of $x$.",
        steps: [
          { id: "s1", explanation: "Look for two numbers with product " + c + " and sum " + b + ".", working: `${x1} \\times ${x2} = ${c},\\ ${x1} + ${x2} = ${b}` },
          { id: "s2", explanation: "Write the quadratic as two brackets.", working: `(x ${r1 >= 0 ? "+" : "-"} ${Math.abs(r1)})(x ${r2 >= 0 ? "+" : "-"} ${Math.abs(r2)})` },
          { id: "s3", explanation: "Expand mentally to check you recover the original quadratic." },
        ],
        tags: ["factorisation", "quadratics"],
        marks: ctx.marks || 2,
        verify: [
          { kind: "equivalent", a: `(x + (${r1}))*(x + (${r2}))`, b: `x**2 + (${b})*x + (${c})` },
        ],
      };
    },
  },
  {
    id: "quad-formula",
    chapter: "Algebra and functions",
    build: (ctx) => {
      const a = randInt(1, 3);
      const b = randInt(-8, 8);
      const c = randInt(-6, 6) || 3;
      const disc = b * b - 4 * a * c;
      const sign = (n: number) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`);
      const gcd2 = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd2(y, x % y));
      const fmtFrac = (n: number, d: number): string => {
        const g = gcd2(n, d) || 1;
        const nn = n / g;
        const dd = d / g;
        if (dd === 1) return `${nn}`;
        return nn < 0 ? `-\\frac{${Math.abs(nn)}}{${dd}}` : `\\frac{${nn}}{${dd}}`;
      };
      let answer: string;
      if (disc < 0) {
        answer = "No real solutions (discriminant $< 0$).";
      } else {
        const s = Math.sqrt(disc);
        if (Number.isInteger(s)) {
          answer = `$x = ${fmtFrac(-b + s, 2 * a)}$ or $x = ${fmtFrac(-b - s, 2 * a)}$`;
        } else {
          answer = `Exact form: $x = \\frac{${-b} \\pm \\sqrt{${disc}}}{${2 * a}}$`;
        }
      }
      return {
        title: "Solving a quadratic",
        questionText: `Solve $${a}x^2 ${sign(b)}x ${sign(c)} = 0$ giving your answers in exact form.`,
        answer,
        method: "Use the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
        steps: [
          { id: "s1", explanation: "Identify $a$, $b$ and $c$.", working: `a = ${a}, b = ${b}, c = ${c}` },
          { id: "s2", explanation: "Compute the discriminant $b^2 - 4ac$.", working: `${b}^2 - 4(${a})(${c}) = ${disc}` },
          { id: "s3", explanation: "Substitute into the quadratic formula and simplify." },
        ],
        tags: ["quadratics", "quadratic formula"],
        marks: ctx.marks || 4,
        verify: [
          {
            kind: "solve",
            equation: `${a}*x**2 + (${b})*x + (${c})`,
            realOnly: true,
            expected:
              disc < 0
                ? []
                : [
                    `(-(${b}) + sqrt(${disc}))/(2*${a})`,
                    `(-(${b}) - sqrt(${disc}))/(2*${a})`,
                  ],
          },
        ],
      };
    },
  },
  {
    id: "differentiate-polynomial",
    chapter: "Differentiation",
    build: (ctx) => {
      const a = randInt(2, 7);
      const b = randInt(2, 6);
      const c = randInt(1, 9);
      const d = randInt(-9, 9);
      const pow = b - 1 === 1 ? "x" : `x^${b - 1}`;
      return {
        title: "Differentiating a polynomial",
        questionText: `Find $\\frac{dy}{dx}$ for $y = ${a}x^${b} - ${c}x + ${d}$.`,
        answer: `$${a * b}${pow} - ${c}$`,
        method: "Apply $\\frac{d}{dx}(ax^n) = anx^{n-1}$ term by term.",
        steps: [
          { id: "s1", explanation: `Differentiate ${a}x^${b}: multiply by the power and reduce the power by 1.`, working: `${a}\\times${b}x^{${b}-1} = ${a * b}${pow}` },
          { id: "s2", explanation: `Differentiate -${c}x to get -${c}.` },
          { id: "s3", explanation: "The constant differentiates to 0." },
        ],
        tags: ["differentiation", "power rule"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "derivative", expr: `${a}*x**${b} - ${c}*x + (${d})`, expected: `${a * b}*x**${b - 1} - ${c}` },
        ],
      };
    },
  },
  {
    id: "chain-rule",
    chapter: "Differentiation",
    build: (ctx) => {
      const a = randInt(2, 5);
      const n = randInt(2, 4);
      const pow = n - 1 === 1 ? `(${a}x + 1)` : `(${a}x + 1)^${n - 1}`;
      return {
        title: "Chain rule",
        questionText: `Find $\\frac{dy}{dx}$ for $y = (${a}x + 1)^${n}$.`,
        answer: `$${a * n}${pow}$`,
        method: "Chain rule: differentiate the outer function, keep the inner, then multiply by the inner derivative.",
        steps: [
          { id: "s1", explanation: "Let $u = ${a}x + 1$, so $y = u^${n}$." },
          { id: "s2", explanation: "Differentiate: $\\frac{dy}{du} = ${n}u^{${n - 1}}$ and $\\frac{du}{dx} = ${a}$." },
          { id: "s3", explanation: "Multiply: $\\frac{dy}{dx} = ${n} \\times ${a} \\times (${a}x+1)^{${n - 1}}$." },
        ],
        tags: ["chain rule", "differentiation"],
        marks: ctx.marks || 4,
        verify: [
          { kind: "derivative", expr: `(${a}*x + 1)**${n}`, expected: `${a * n}*(${a}*x + 1)**${n - 1}` },
        ],
      };
    },
  },
  {
    id: "definite-integral",
    chapter: "Integration",
    build: (ctx) => {
      const a = randInt(2, 6);
      const b = randInt(1, 4);
      const lower = 0;
      const upper = randInt(1, 3);
      const valNum = a * upper ** 2 + 2 * b * upper;
      const val = valNum / 2;
      return {
        title: "Definite integral",
        questionText: `Evaluate $\\int_{${lower}}^{${upper}} (${a}x + ${b})\\,dx$.`,
        answer: `$${val}$`,
        method: "Integrate term by term, then apply the limits.",
        steps: [
          { id: "s1", explanation: "Antiderivative of $ax + b$ is $\\frac{a}{2}x^2 + bx$.", working: `$\\frac{${a}}{2}x^2 + ${b}x$` },
          { id: "s2", explanation: `Substitute the upper limit x = ${upper}.`, working: `$\\frac{${a}}{2}(${upper})^2 + ${b}(${upper}) = ${val}$` },
          { id: "s3", explanation: "Substitute the lower limit x = " + lower + " (gives 0) and subtract." },
        ],
        tags: ["integration", "definite integrals"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "integral_definite", expr: `${a}*x + ${b}`, lower, upper, expected: `${valNum}/2` },
        ],
      };
    },
  },
  {
    id: "indefinite-integral",
    chapter: "Integration",
    build: (ctx) => {
      const a = randInt(2, 8);
      const n = randInt(2, 5);
      return {
        title: "Indefinite integral",
        questionText: `Find $\\int ${a}x^${n}\\,dx$.`,
        answer: `$\\frac{${a}}{${n + 1}}x^{${n + 1}} + c$`,
        method: "Increase the power by 1 and divide by the new power, then add the constant of integration.",
        steps: [
          { id: "s1", explanation: `Add 1 to the power: ${n} + 1 = ${n + 1}.` },
          { id: "s2", explanation: "Divide the coefficient by the new power.", working: `$\\frac{${a}}{${n + 1}}x^{${n + 1}}$` },
          { id: "s3", explanation: "Always add the constant of integration $+c$." },
        ],
        tags: ["integration", "indefinite integrals"],
        marks: ctx.marks || 2,
        verify: [
          { kind: "integral_indefinite", expr: `${a}*x**${n}`, expected: `${a}/${n + 1}*x**${n + 1}` },
        ],
      };
    },
  },
  {
    id: "trig-equation",
    chapter: "Trigonometry",
    build: (ctx) => {
      const angle = randItem([30, 45, 60, 120, 135, 150]);
      const sinVal = Math.sin((angle * Math.PI) / 180);
      const formatted = Math.abs(sinVal - 0.5) < 1e-9 ? "0.5" : Math.abs(sinVal - Math.sqrt(3) / 2) < 1e-9 ? "\\frac{\\sqrt{3}}{2}" : Math.abs(sinVal - Math.sqrt(2) / 2) < 1e-9 ? "\\frac{\\sqrt{2}}{2}" : `${Math.round(sinVal * 1000) / 1000}`;
      const alt = 180 - angle;
      return {
        title: "Trigonometric equation",
        questionText: `Solve $\\sin \\theta = ${formatted}$ for $0^\\circ \\le \\theta \\le 360^\\circ$.`,
        answer: `$\\theta = ${angle}^\\circ, ${alt}^\\circ$`,
        method: "Use the sine graph: solutions are $\\theta$ and $180^\\circ - \\theta$ in the given range.",
        steps: [
          { id: "s1", explanation: `Find the principal value: $\\sin^{-1}(${formatted}) = ${angle}^\\circ$.` },
          { id: "s2", explanation: `Use the identity $\\sin\\theta = \\sin(180^\\circ - \\theta)$ to find the second solution: $180 - ${angle} = ${alt}$.` },
          { id: "s3", explanation: `Both solutions lie in $0^\\circ \\le \\theta \\le 360^\\circ$, so $\\theta = ${angle}^\\circ$ or $${alt}^\\circ$.` },
        ],
        tags: ["trigonometry", "sine equation"],
        marks: ctx.marks || 3,
        verify: [
          {
            kind: "solve_domain",
            equation: `sin(pi*theta/180) - sin(pi*${angle}/180)`,
            var: "theta",
            domain: [0, 360],
            expected: [`${angle}`, `${alt}`],
          },
        ],
      };
    },
  },
  {
    id: "geometric-series",
    chapter: "Sequences and series",
    build: (ctx) => {
      const a = randInt(3, 12);
      const r = randItem([0.5, 0.25, 2, 0.2]);
      const n = randInt(6, 10);
      const sum = a * (1 - Math.pow(r, n)) / (1 - r);
      const rStr = Number.isInteger(r) ? `${r}` : `\\frac{1}{${Math.round(1 / r)}}`;
      return {
        title: "Geometric series sum",
        questionText: `A geometric series has first term $a = ${a}$, common ratio $r = ${rStr}$ and $n = ${n}$ terms. Find $S_${n}$.`,
        answer: `$S_${n} = ${Math.round(sum * 100) / 100}$`,
        method: "Use $S_n = \\frac{a(1 - r^n)}{1 - r}$ for $r \\ne 1$.",
        steps: [
          { id: "s1", explanation: "Identify $a$, $r$ and $n$.", working: `a = ${a}, r = ${r}, n = ${n}` },
          { id: "s2", explanation: "Apply the sum formula.", working: `S_${n} = \\frac{${a}(1 - ${rStr}^{${n}})}{1 - ${rStr}}` },
          { id: "s3", explanation: "Calculate and give the answer to a suitable accuracy." },
        ],
        tags: ["geometric series", "sequences"],
        marks: ctx.marks || 4,
        verify: [
          {
            kind: "numeric",
            expr: `${a}*(1 - ${r}**${n})/(1 - ${r})`,
            expected: `${Math.round(sum * 100) / 100}`,
            absTol: 0.0051,
          },
        ],
      };
    },
  },
  {
    id: "binomial-expansion",
    chapter: "Sequences and series",
    build: (ctx) => {
      const n = randInt(3, 6);
      return {
        title: "Binomial expansion",
        questionText: `Expand $(1 + x)^${n}$ in ascending powers of $x$ up to and including the $x^3$ term.`,
        answer: `$1 + ${n}x + \\frac{${n * (n - 1)}}{2}x^2 + \\frac{${n * (n - 1) * (n - 2)}}{6}x^3 + \\ldots$`,
        method: "Use $(1+x)^n = 1 + nx + \\frac{n(n-1)}{2!}x^2 + \\frac{n(n-1)(n-2)}{3!}x^3 + \\ldots$",
        steps: [
          { id: "s1", explanation: `Coefficient of $x$: $n = ${n}` },
          { id: "s2", explanation: `Coefficient of $x^2$: $\\frac{n(n-1)}{2} = \\frac{${n}(${n - 1})}{2} = ${(n * (n - 1)) / 2}` },
          { id: "s3", explanation: `Coefficient of $x^3$: $\\frac{n(n-1)(n-2)}{6} = ${(n * (n - 1) * (n - 2)) / 6}` },
        ],
        tags: ["binomial", "expansion"],
        marks: ctx.marks || 4,
        verify: [
          {
            kind: "expand_coeffs",
            expr: `(1 + x)**${n}`,
            var: "x",
            powers: {
              0: 1,
              1: n,
              2: (n * (n - 1)) / 2,
              3: (n * (n - 1) * (n - 2)) / 6,
            },
          },
        ],
      };
    },
  },
  {
    id: "probability-dice",
    chapter: "Probability",
    build: (ctx) => {
      const target = randInt(5, 11);
      let count = 0;
      for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === target) count++;
      const g = gcd(count, 36);
      const num = count / g;
      const den = 36 / g;
      return {
        title: "Dice probability",
        questionText: `Two fair six-sided dice are rolled. Find the probability that the sum of the scores is ${target}.`,
        answer: `$\\frac{${num}}{${den}}$`,
        method: "Count favourable outcomes over 36 equally likely outcomes.",
        steps: [
          { id: "s1", explanation: "There are $6 \\times 6 = 36$ equally likely outcomes." },
          { id: "s2", explanation: `Count the outcomes summing to ${target}.`, working: `${count} favourable outcomes` },
          { id: "s3", explanation: `Probability = $\\frac{${count}}{36}$, simplified to $\\frac{${num}}{${den}}$.` },
        ],
        tags: ["probability", "sample space"],
        marks: ctx.marks || 2,
        verify: [
          { kind: "dice_sum", target, expected: `${num}/${den}` },
        ],
      };
    },
  },
  {
    id: "normal-distribution",
    chapter: "Statistical distributions",
    build: (ctx) => {
      const mu = randInt(50, 70);
      const sigma = randInt(5, 12);
      return {
        title: "Normal distribution",
        questionText: `A random variable $X \\sim N(${mu}, ${sigma}^2)$. Explain why $P(X > ${mu}) = 0.5$.`,
        answer: "The normal distribution is symmetric about the mean $\\mu = " + mu + "$, so half the probability lies above the mean.",
        method: "Use symmetry of the normal distribution about the mean.",
        steps: [
          { id: "s1", explanation: `The normal curve is symmetric about $\\mu = ${mu}$.` },
          { id: "s2", explanation: "The total area under the curve is 1." },
          { id: "s3", explanation: "Therefore the area above the mean is $1 \\div 2 = 0.5$." },
        ],
        tags: ["normal distribution", "symmetry"],
        marks: ctx.marks || 2,
        verify: [
          { kind: "text", note: "conceptual symmetry claim, reviewed manually" },
        ],
      };
    },
  },
  {
    id: "suvat",
    chapter: "Kinematics",
    build: (ctx) => {
      const u = randInt(3, 15);
      const a = randInt(2, 6);
      const t = randInt(2, 6);
      const v = u + a * t;
      const s = u * t + 0.5 * a * t * t;
      return {
        title: "SUVAT kinematics",
        questionText: `A particle starts with velocity $u = ${u}\\,\\mathrm{ms^{-1}}$ and accelerates at $a = ${a}\\,\\mathrm{ms^{-2}}$ for $t = ${t}\\,\\mathrm{s}$. Find the final velocity $v$ and the distance travelled $s$.`,
        answer: `$v = ${v}\\,\\mathrm{ms^{-1}}$ and $s = ${s}\\,\\mathrm{m}$`,
        method: "Use $v = u + at$ and $s = ut + \\frac{1}{2}at^2$.",
        steps: [
          { id: "s1", explanation: "Find $v$ using $v = u + at$.", working: `${u} + ${a} \\times ${t} = ${v}` },
          { id: "s2", explanation: "Find $s$ using $s = ut + \\frac{1}{2}at^2$.", working: `${u}(${t}) + \\frac{1}{2}(${a})(${t})^2 = ${s}` },
          { id: "s3", explanation: "Always check units: $\\mathrm{ms^{-1}}$ and $\\mathrm{m}$." },
        ],
        tags: ["suvat", "kinematics"],
        marks: ctx.marks || 4,
        verify: [
          { kind: "numeric", expr: `${u} + ${a}*${t}`, expected: `${v}` },
          { kind: "numeric", expr: `${u}*${t} + Rational(1,2)*${a}*${t}**2`, expected: `${s}` },
        ],
      };
    },
  },
  {
    id: "newton-second-law",
    chapter: "Forces and Newton's laws",
    build: (ctx) => {
      const m = randInt(3, 12);
      const f = randInt(8, 40);
      const aVal = Math.round((f / m) * 100) / 100;
      const accuracy = f % m !== 0 ? ", giving your answer to 2 d.p." : "";
      return {
        title: "Newton's second law",
        questionText: `A resultant force of $${f}\\,\\mathrm{N}$ acts on a mass of $${m}\\,\\mathrm{kg}$. Find the acceleration${accuracy}.`,
        answer: `$a = ${aVal}\\,\\mathrm{ms^{-2}}$`,
        method: "Use Newton's second law $F = ma$, so $a = \\frac{F}{m}$.",
        steps: [
          { id: "s1", explanation: `Substitute $F = ${f}$ and $m = ${m}$ into $a = \\frac{F}{m}$.` },
          { id: "s2", explanation: `Calculate $a = \\frac{${f}}{${m}} = ${aVal}\\,\\mathrm{ms^{-2}}$.` },
          { id: "s3", explanation: "Check the units are $\\mathrm{ms^{-2}}$." },
        ],
        tags: ["newton's laws", "forces"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "numeric", expr: `${f}/${m}`, expected: `${aVal}`, absTol: 0.0051 },
        ],
      };
    },
  },
  {
    id: "straight-line",
    chapter: "Coordinate geometry",
    build: (ctx) => {
      const m = randInt(-4, 5) || 2;
      const x1 = randInt(-5, 5);
      const y1 = randInt(-5, 5);
      const c = y1 - m * x1;
      return {
        title: "Equation of a straight line",
        questionText: `Find the equation of the line through $(${x1}, ${y1})$ with gradient $${m}$. Give your answer in the form $y = mx + c$.`,
        answer: c === 0 ? `$y = ${m}x$` : `$y = ${m}x ${c >= 0 ? "+" : "-"} ${Math.abs(c)}$`,
        method: "Use $y - y_1 = m(x - x_1)$ then rearrange.",
        steps: [
          { id: "s1", explanation: "Substitute into $y - y_1 = m(x - x_1)$.", working: `y - ${y1} = ${m}(x - ${x1})` },
          { id: "s2", explanation: "Expand the bracket.", working: `y - ${y1} = ${m}x - ${m * x1}` },
          { id: "s3", explanation: "Rearrange to $y = mx + c$.", working: c === 0 ? `y = ${m}x` : `y = ${m}x ${c >= 0 ? "+" : "-"} ${Math.abs(c)}` },
        ],
        tags: ["straight line", "gradient"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "numeric", expr: `${m}*(${x1}) + (${c})`, expected: `${y1}` },
        ],
      };
    },
  },
  {
    id: "log-equation",
    chapter: "Exponentials and logarithms",
    build: (ctx) => {
      const base = randItem([2, 3, 10]);
      const exp = randInt(2, 5);
      const val = Math.pow(base, exp);
      return {
        title: "Logarithmic equation",
        questionText: `Solve $\\log_${base} x = ${exp}$.`,
        answer: `$x = ${val}$`,
        method: "Rewrite in exponential form: $\\log_b y = n \\iff y = b^n$.",
        steps: [
          { id: "s1", explanation: `Convert to index form: $x = ${base}^{${exp}}$.` },
          { id: "s2", explanation: `Calculate: $x = ${val}$.` },
          { id: "s3", explanation: "Check by substituting back: $\\log_${base} ${val} = ${exp}$ ✓" },
        ],
        tags: ["logarithms", "indices"],
        marks: ctx.marks || 2,
        verify: [
          { kind: "solve", equation: `log(x, ${base}) - ${exp}`, expected: [`${val}`] },
        ],
      };
    },
  },
  {
    id: "proof-by-contradiction",
    chapter: "Proof",
    build: (ctx) => {
      return {
        title: "Proof method",
        questionText: `State, with a reason, the most suitable method to prove that "there is no smallest integer": proof by contradiction, or proof by induction?`,
        answer: "Proof by contradiction: assume a smallest integer exists and derive a contradiction with the well-ordering principle.",
        method: "Assume the opposite of the statement and show it leads to a contradiction.",
        steps: [
          { id: "s1", explanation: "Assume for contradiction that a smallest integer $m$ exists." },
          { id: "s2", explanation: "Then $m - 1$ is a smaller integer, contradicting minimality." },
          { id: "s3", explanation: "Since a contradiction arises, the assumption is false, so no smallest integer exists." },
        ],
        tags: ["proof", "contradiction"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "text", note: "conceptual answer, reviewed manually" },
        ],
      };
    },
  },
  {
    id: "vector-line",
    chapter: "Vectors",
    build: (ctx) => {
      const a = [randInt(1, 6), randInt(1, 6), randInt(1, 6)];
      const b = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
      const k = randInt(2, 5);
      const target = [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
      return {
        title: "Position vectors and lines",
        questionText: `A line has equation $\\mathbf{r} = \\begin{pmatrix} ${a[0]} \\\\ ${a[1]} \\\\ ${a[2]} \\end{pmatrix} + \\lambda \\begin{pmatrix} ${b[0]} \\\\ ${b[1]} \\\\ ${b[2]} \\end{pmatrix}$. Show that the point $P$ with position vector $\\begin{pmatrix} ${target[0]} \\\\ ${target[1]} \\\\ ${target[2]} \\end{pmatrix}$ lies on the line.`,
        answer: `Using $\\lambda = ${k}$ gives $\\begin{pmatrix} ${a[0]} + ${k}(${b[0]}) \\\\ ${a[1]} + ${k}(${b[1]}) \\\\ ${a[2]} + ${k}(${b[2]}) \\end{pmatrix} = \\begin{pmatrix} ${target[0]} \\\\ ${target[1]} \\\\ ${target[2]} \\end{pmatrix}$ ✓`,
        method: "Set the line equation equal to the position vector of $P$ and solve for $\\lambda$.",
        steps: [
          { id: "s1", explanation: "Write $a + \\lambda b = \\overrightarrow{OP}$ component-wise." },
          { id: "s2", explanation: `Solve any component for $\\lambda$: e.g. ${a[0]} + ${b[0]}\\lambda = ${target[0]} gives $\\lambda = ${k}$.` },
          { id: "s3", explanation: "Check this $\\lambda$ satisfies the other two components." },
        ],
        tags: ["vectors", "straight line"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "vector_on_line", a, k, b, target },
        ],
      };
    },
  },
  {
    id: "moments",
    chapter: "Moments",
    build: (ctx) => {
      const f = randInt(10, 50);
      const d = randInt(2, 8);
      const d2 = randItem([2, 3, 4, 5, 6, 7, 8].filter((x) => x !== d));
      const product = f * d;
      const exact = product % d2 === 0;
      const f2 = product / d2;
      const answer = exact
        ? `$F = ${f2}\\,\\mathrm{N}$`
        : `$F = \\frac{${product}}{${d2}}\\,\\mathrm{N} \\approx ${Math.round(f2 * 100) / 100}\\,\\mathrm{N}$ (to 2 d.p.)`;
      const closer = d2 < d;
      return {
        title: "Moment equilibrium",
        questionText: `A force of $${f}\\,\\mathrm{N}$ acts at a distance of $${d}\\,\\mathrm{m}$ from a pivot. What force acting ${closer ? "closer to" : "further from"} the pivot, at $${d2}\\,\\mathrm{m}$, balances the first?`,
        answer,
        method: "For equilibrium, clockwise moments = anticlockwise moments: $F_1 d_1 = F_2 d_2$.",
        steps: [
          { id: "s1", explanation: `Compute the moment: ${f} \\times ${d} = ${product}\\,\\mathrm{Nm}$.` },
          { id: "s2", explanation: `Set up the balancing moment: $F \\times ${d2} = ${product}$.` },
          { id: "s3", explanation: `Solve: $F = \\frac{${product}}{${d2}}$${exact ? ` = ${f2}\\,\\mathrm{N}` : ` \\approx ${Math.round(f2 * 100) / 100}\\,\\mathrm{N}$ (to 2 d.p.)`}.` },
        ],
        tags: ["moments", "equilibrium"],
        marks: ctx.marks || 3,
        verify: [
          { kind: "solve", equation: `${d2}*W - ${product}`, var: "W", expected: [`${product}/${d2}`] },
        ],
      };
    },
  },
];

const VALIDATION_ATTEMPTS = 8;

const SUBTYPE_CHAPTERS: Record<string, string[]> = {
  algebra: ["Algebra and functions", "Coordinate geometry", "Exponentials and logarithms", "Sequences and series"],
  calculus: ["Differentiation", "Integration", "Numerical methods"],
  trigonometry: ["Trigonometry"],
  geometry: ["Coordinate geometry", "Vectors"],
};

function allowedModules(questionType?: QuestionType): string[] | null {
  if (!questionType) return null;
  if (["pure", "algebra", "calculus", "trigonometry", "geometry"].includes(questionType)) {
    return ["pure"];
  }
  if (questionType === "statistics") return ["stats"];
  if (questionType === "mechanics") return ["mechanics"];
  return null;
}

export class QuestionGenerator {
  private nn = SolvabilityNN.getInstance();

  private buildPool(params: GenerationParams): QuestionTemplate[] {
    let pool = TEMPLATES;

    const modules = allowedModules(params.questionType);
    if (modules) {
      pool = pool.filter((t) => {
        const topic = ALL_CHAPTERS.find((c) => c.chapter === t.chapter);
        return topic ? modules.includes(topic.module) : false;
      });
      const subtype = SUBTYPE_CHAPTERS[params.questionType || ""];
      if (subtype) {
        const narrowed = pool.filter((t) => subtype.includes(t.chapter));
        if (narrowed.length > 0) pool = narrowed;
      }
    }

    if (params.chapter) {
      const ch = params.chapter.toLowerCase();
      const narrowed = pool.filter(
        (t) =>
          t.chapter.toLowerCase().includes(ch) || ch.includes(t.chapter.toLowerCase())
      );
      if (narrowed.length > 0) pool = narrowed;
    }

    if (pool.length === 0) pool = TEMPLATES;
    return pool;
  }

  generateQuestion(params: GenerationParams): GeneratedQuestion {
    const difficulty = params.difficulty;
    const defaultMarks = difficulty === "easy" ? 2 : difficulty === "medium" ? 4 : 6;
    const marks = params.marks || defaultMarks;
    const pool = this.buildPool(params);

    let best: GeneratedQuestion | null = null;
    let bestConfidence = -1;

    for (let attempt = 0; attempt < VALIDATION_ATTEMPTS; attempt++) {
      const template = randItem(pool);
      const topic = findTopicByChapter(template.chapter);
      const spec = specForChapter(template.chapter);
      const built = template.build({ difficulty, marks });
      const base: GeneratedQuestion = {
        id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: built.title,
        questionText: built.questionText,
        questionType: params.questionType ?? moduleToType(topic.module),
        difficulty,
        topics: [topic],
        marks: built.marks,
        examBoard: "Edexcel",
        specification: "A-Level GCE",
        year: "generated",
        source: "real-exam-inspired",
        answer: built.answer,
        method: built.method,
        steps: built.steps,
        formulaSheetAllowed: true,
        calculatorAllowed: difficulty !== "easy",
        chapter: topic.chapter,
        subChapter: topic.section,
        tags: [...built.tags, params.questionType ?? moduleToType(topic.module)],
        specPoint: defaultSpecPoint(template.chapter),
        theme: spec.theme,
        commandWords: extractCommandWords(built.questionText),
        precision: extractPrecision(built.questionText, built.answer),
        verified: true,
        metadata: {
          solvability: {
            isSolvable: false,
            issues: [],
            confidence: 0,
            estimatedDifficulty: difficulty,
            prerequisites: [topic.name],
          },
          generationModel: "template-mlp-v1",
          createdAt: new Date(),
        },
      };
      const candidate: GeneratedQuestion = { ...base, markScheme: markSchemeFor(base) };

      const prediction = this.nn.predict({
        questionText: candidate.questionText,
        answer: candidate.answer,
        steps: candidate.steps,
        method: candidate.method,
        marks: candidate.marks,
      });

      if (prediction.confidence > bestConfidence) {
        bestConfidence = prediction.confidence;
        best = {
          ...candidate,
          metadata: {
            ...candidate.metadata,
            solvability: {
              isSolvable: prediction.solvable,
              issues: prediction.solvable ? [] : ["Rejected by neural network validator"],
              confidence: prediction.confidence,
              estimatedDifficulty: difficulty,
              prerequisites: [topic.name],
            },
          },
        };
      }

      if (prediction.solvable && prediction.confidence >= 0.7 && best) {
        return best;
      }
    }

    return best as GeneratedQuestion;
  }

  generateQuestions(params: GenerationParams): GeneratedQuestion[] {
    const count = Math.min(params.count || 1, 10);
    const results: GeneratedQuestion[] = [];
    const seen = new Set<string>();
    let attempts = 0;
    while (results.length < count && attempts < count * 5) {
      attempts++;
      const q = this.generateQuestion(params);
      const key = q.title + q.questionText;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(q);
      }
    }
    if (results.length === 0) {
      results.push(this.generateQuestion(params));
    }
    return results;
  }
}

export function sampleVerificationSpecs(samplesPerTemplate = 25): VerifySpec[] {
  const specs: VerifySpec[] = [];
  for (const template of TEMPLATES) {
    for (let i = 0; i < samplesPerTemplate; i++) {
      const built = template.build({ difficulty: "medium", marks: 4 });
      built.verify.forEach((spec, j) => {
        specs.push({ ...spec, id: `${template.id}#${i}.${j}` });
      });
    }
  }
  return specs;
}
