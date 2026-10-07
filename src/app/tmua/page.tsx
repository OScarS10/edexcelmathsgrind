import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Brain,
  Clock,
  Layers,
  Lightbulb,
  Target,
  Timer,
} from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { TMUA_BANK } from "@/data/questions/tmua-bank";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight">{children}</h2>
      {note && <span className="text-xs text-zinc-500">{note}</span>}
    </div>
  );
}

const REASONING_TOOLS = [
  {
    title: "Counterexample",
    rule: "To disprove “every/all”, one single case is enough. Test the boundary first: 0, 1, −1, and the number that makes the expression collapse.",
    example:
      "Claim: $n^2 - n + 41$ is prime for every positive integer $n$. Take $n = 41$: the expression becomes $41^2$, which is not prime. Claim dead.",  },
  {
    title: "Hidden assumptions",
    rule: "Find the step that quietly needs something extra to be true. Means are the usual trap — an average only describes the “typical” member of a symmetric distribution.",
    example:
      "“The average family has 2.4 children, so most families have two.” This assumes the distribution is symmetric; otherwise the median, not the mean, describes “most”.",
  },
  {
    title: "Necessary vs sufficient",
    rule: "Draw the arrow. $P \\Rightarrow Q$ means P is sufficient for Q and Q is necessary for P — the converse arrow does not come free.",
    example:
      "$n$ divisible by $6$ implies $n$ is even (sufficient). The reverse fails — $8$ is even but not divisible by $6$ — so being even is necessary, not sufficient.",
  },
  {
    title: "Flawed arguments",
    rule: "Spot converse errors, hidden exceptions and averages that hide spread. Ask: does the conclusion actually follow from the premises, or just sound like it?",
    example:
      "“Every square I drew has four sides, so every four-sided shape is a square.” The conclusion does not follow from the premise — rectangles are the counterexample.",
  },
  {
    title: "Consistency checks",
    rule: "When several statements must hold together, substitute a candidate and see whether any pair contradicts. Boundary values and the smallest cases do most of the work.",
    example:
      "If $x + y = 10$ and $xy = 30$, then $x$ and $y$ are roots of $t^2 - 10t + 30 = 0$, whose discriminant is $100 - 120 < 0$: no real pair exists, so the two statements are inconsistent over the reals.",
  },
  {
    title: "Data in context",
    rule: "Read the units, the base and the timeframe before calculating. Percentage change from a small base, and correlation sold as cause, are the standard traps.",
    example:
      "A town's population rises from 200 to 260: that is $30\\%$, not “a rise of 60%”. The base is always the starting value.",
  },
];

const PROOF_METHODS = [
  {
    name: "Direct proof",
    when: "Start from known facts and chain them to the conclusion.",
    example: "Prove $2n + 1$ is odd for all integers $n$: it equals $2n + 1$ — a multiple of 2 plus 1, which is the definition of odd.",
  },
  {
    name: "Proof by contradiction",
    when: "Assume the opposite and derive an impossibility. Classic for irrationality and “no solutions” results.",
    example: "Assume $\\sqrt{2} = \\frac{p}{q}$ in lowest terms. Then $p^2 = 2q^2$, so $p$ is even, so $q$ is even — contradicting lowest terms.",
  },
  {
    name: "Counterexample",
    when: "Disprove a universal claim with one decisive case (see Paper 2 toolkit above).",
    example: "$n^2 + n + 41$ is not prime for $n = 41$: the value is $41^2$.",
  },
  {
    name: "Exhaustion",
    when: "The set of cases is finite and small enough to list — state why it is finite.",
    example: "Every square number leaves remainder 0, 1 or 4 when divided by 5 — check $0^2, 1^2, 2^2, 3^2, 4^2$ mod 5 and invoke periodicity.",
  },
  {
    name: "Mathematical induction",
    when: "Further Maths staple for statements about all positive integers: base case, inductive step.",
    example: "$1 + 2 + \\dots + n = \\frac{n(n+1)}{2}$: true for $n=1$; if true for $n=k$, then adding $k+1$ gives $\\frac{(k+1)(k+2)}{2}$.",
  },
];

const FM_BRIDGING = [
  { from: "Quadratics with real roots", to: "Complex numbers", detail: "$x^2 + 1 = 0$ has no real solution — FM completes it with $i$, where $i^2 = -1$, and adds modulus–argument arithmetic." },
  { from: "Transformations of $y = f(x)$", to: "Matrices", detail: "FM encodes stretches, rotations and shears as $2 \\times 2$ matrices; determinant gives the area scale factor." },
  { from: "Differentiating $x^n$, $e^x$, $\\ln x$", to: "Inverse trig & hyperbolics", detail: "$\\frac{d}{dx}\\arctan x = \\frac{1}{1+x^2}$; $\\sinh x = \\frac{e^x - e^{-x}}{2}$ differentiates to $\\cosh x$." },
  { from: "Trapezium rule for $\\int y\\,\\mathrm{d}x$", to: "Improper & inverse-trig integrals", detail: "$\\int \\frac{1}{1+x^2}\\,\\mathrm{d}x = \\arctan x + c$; FM also handles infinite limits." },
  { from: "Binomial expansion of $(1+x)^n$", to: "Maclaurin series", detail: "Expand any differentiable function at $x = 0$: $e^x = 1 + x + \\frac{x^2}{2!} + \\dots$" },
  { from: "$\\sin, \\cos$ on the unit circle", to: "Polar coordinates", detail: "$x = r\\cos\\theta$, $y = r\\sin\\theta$; sketching $r = a\\cos\\theta$ etc." },
  { from: "Arithmetic & geometric series", to: "Sums of $r$ and $r^2$", detail: "$\\sum r = \\frac{n(n+1)}{2}$, $\\sum r^2 = \\frac{n(n+1)(2n+1)}{6}$ — the engine behind induction questions." },
];

export default function TmuaPage() {
  const questionCount = TMUA_BANK.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          <Target className="h-4 w-4" aria-hidden />
          Admissions extension material
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          TMUA — Test of Mathematics for University Admission
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The TMUA is a two-paper admissions test used by several UK universities for
          maths-heavy courses (always check the specific course requirements before you book).
          It does not ask for content beyond A-level — it asks for the same content used{" "}
          <em>fast, in unfamiliar settings, with flawless reasoning</em>. Everything below is
          built on the A-level syllabus you already revise here.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <Layers className="h-4 w-4 text-blue-600" aria-hidden /> Paper 1
            </div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong>Mathematical knowledge</strong> — 20 multiple-choice questions in 75
              minutes, A-level content applied in unfamiliar ways.
            </div>
          </div>
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <Brain className="h-4 w-4 text-blue-600" aria-hidden /> Paper 2
            </div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong>Mathematical reasoning</strong> — 20 multiple-choice questions in 75
              minutes: logic, proof, assumptions and data in context.
            </div>
          </div>
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <Clock className="h-4 w-4 text-blue-600" aria-hidden /> Pace
            </div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong>3 min 45 s per question</strong>, no method marks. Flag anything over
              90 seconds, move on, return — accuracy beats sunk cost.
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/practice?mode=tmua"
            className="flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start TMUA practice <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/progress"
            className="flex h-11 items-center rounded-md border border-zinc-300 px-5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Check my readiness
          </Link>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {questionCount} original questions across both papers — every answer machine-verified
          before it ever reaches you.
        </p>
      </div>

      {/* Paper 2 reasoning toolkit */}
      <Card className="mt-4">
        <SectionTitle note="Paper 2 is won or lost here">The reasoning toolkit</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {REASONING_TOOLS.map((t) => (
            <div key={t.title} className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="flex items-center gap-1.5 text-sm font-bold">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                {t.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{t.rule}</p>
              <p className="mt-2 rounded bg-zinc-50 p-2.5 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <MathText>{t.example}</MathText>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Proof technique */}
      <Card className="mt-4">
        <SectionTitle note="examiners' favourite cross-over topic">Proof technique</SectionTitle>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {PROOF_METHODS.map((p) => (
            <li key={p.name} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-xs text-zinc-500">{p.when}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <MathText>{p.example}</MathText>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Proof is also examined in the A-level papers themselves (chapter: Proof) — revising
          it once serves both.
        </p>
      </Card>

      {/* Further Maths bridging */}
      <Card className="mt-4">
        <SectionTitle note="A-level Maths → Further Maths">Further Maths bridging</SectionTitle>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Several universities co-recommend Further Maths or expect comfort with its first
          topics. These are the seven bridges from what you already know to what FM assumes on
          day one:
        </p>
        <ul className="space-y-2.5">
          {FM_BRIDGING.map((b) => (
            <li key={b.to} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-zinc-500">
                  <MathText>{b.from}</MathText>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                <span className="font-bold">{b.to}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                <MathText>{b.detail}</MathText>
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Where to start */}
      <Card className="mt-4">
        <SectionTitle>Where to start</SectionTitle>
        <ol className="space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span>
              <strong>1.</strong> Get the A-level core to 80%+ accuracy — TMUA assumes it.
            </span>
            <Link href="/progress" className="shrink-0 font-semibold text-blue-700 hover:underline dark:text-blue-300">
              Progress
            </Link>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>
              <strong>2.</strong> Warm up any wobbly prerequisites before timing anything.
            </span>
            <Link href="/practice?mode=foundation" className="shrink-0 font-semibold text-blue-700 hover:underline dark:text-blue-300">
              Foundations
            </Link>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>
              <strong>3.</strong> Practise TMUA-style questions, then drill the ones you miss.
            </span>
            <Link href="/practice?mode=tmua" className="shrink-0 font-semibold text-blue-700 hover:underline dark:text-blue-300">
              TMUA set
            </Link>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>
              <strong>4.</strong> Re-test mistakes until the error log is empty.
            </span>
            <Link href="/practice?mode=mistakes" className="shrink-0 font-semibold text-blue-700 hover:underline dark:text-blue-300">
              Mistakes
            </Link>
          </li>
        </ol>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
          <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Scores, formats and university requirements change — confirm the current details on
          the official TMUA and university course pages before booking.
        </p>
      </Card>
    </div>
  );
}
