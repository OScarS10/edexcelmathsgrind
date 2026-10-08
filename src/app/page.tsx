import Link from "next/link";
import { BookOpen, Search, Brain, Award, CheckCircle, Timer, Layers, Target, TrendingUp, Zap } from "lucide-react";
import { DESIGN_LAWS } from "@/lib/design/laws";

const STEPS = [
  {
    title: "1. Choose a focus",
    body: "Pick difficulty, module and chapter — or browse chapters and jump straight into a topic.",
  },
  {
    title: "2. Answer exam-style questions",
    body: "Questions are modelled on Edexcel past papers and validated by a neural network before they reach you.",
  },
  {
    title: "3. Learn from mistakes",
    body: "Wrong answers unlock graded hints first, then a full worked explanation with an examiner-style mark breakdown and the likely misconception.",
  },
];

const HIGH_YIELD = [
  "Algebra & functions",
  "Differentiation",
  "Integration",
  "Trigonometry",
  "Probability",
  "Distributions",
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-blue-50/70 to-white dark:from-zinc-950 dark:to-black">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            <Award className="h-3.5 w-3.5" /> Pearson Edexcel · A-Level GCE (9MA0)
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            A-Level Maths revision that marks itself
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Past-paper style practice questions, neural-network validated
            generation, chapter search and instant worked explanations when you
            get something wrong — plus spaced repetition, an honest gap analysis
            and TMUA admissions practice.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/practice"
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <BookOpen className="h-4 w-4" /> Start practising
            </Link>
            <Link
              href="/search"
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-6 text-base font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <Search className="h-4 w-4" /> Browse chapters
            </Link>
            <Link
              href="/tmua"
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-6 text-base font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <Target className="h-4 w-4" /> TMUA practice
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/skills"
            className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <Zap className="h-6 w-6 text-zinc-600" />
            <p className="mt-3 font-semibold group-hover:underline">
              Skills gym
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Drill techniques, not just chapters: graphs &amp;
              transformations, differentiation, integration, trigonometry,
              vectors, mechanics and more.
            </p>
          </Link>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <Brain className="h-6 w-6 text-purple-600" />
            <p className="mt-3 font-semibold">Neural-net validated</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              A trained MLP scores every generated question for solvability —
              only questions clearing the confidence threshold reach you.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <p className="mt-3 font-semibold">Forgiving marking</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              LaTeX, plain text, fractions and &ldquo;or&rdquo;-separated sets
              all accepted — your answer is judged on maths, not formatting.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <Timer className="h-6 w-6 text-amber-600" />
            <p className="mt-3 font-semibold">Timeboxed sprints</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Every question shows an estimated time based on its marks so your
              practice stays focused instead of expanding.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <p className="mt-3 font-semibold">Progress that tells the truth</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Gap analysis in paper-mark terms, a rehearsal grade estimate with a
              stated range, spaced-repetition due dates and a plan that works
              backwards from your exam date — exportable as a parent or teacher
              report.
            </p>
            <Link
              href="/progress"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              View progress
            </Link>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <Target className="h-6 w-6 text-purple-600" />
            <p className="mt-3 font-semibold">TMUA admissions practice</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Competitive maths courses ask for the TMUA: A-level content at
              speed, plus Paper 2 reasoning — counterexamples, hidden
              assumptions and flawed arguments — with a Further Maths bridging
              guide alongside.
            </p>
            <Link
              href="/tmua"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Open TMUA hub
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <p className="font-semibold">High-yield chapters (Pareto)</p>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            A small share of the specification carries most of the marks. These
            chapters are badged &ldquo;High yield&rdquo; and surfaced first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HIGH_YIELD.map((t) => (
              <span
                key={t}
                className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold">
            Built on evidence-based UX laws
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Every screen in this app applies these {DESIGN_LAWS.length} laws
            deliberately:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DESIGN_LAWS.map((law) => (
              <details
                key={law.name}
                className="group rounded-lg border border-zinc-200 bg-white p-4 open:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {law.name}
                    <span className="text-zinc-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <em>{law.principle}</em>
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Applied:</span>{" "}
                  {law.appliedAs}
                </p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
          Independent revision tool for Pearson Edexcel A-Level Mathematics.
          Not affiliated with or endorsed by Pearson. Questions are original and
          written in the style of published past papers.
        </footer>
      </div>
    </div>
  );
}
