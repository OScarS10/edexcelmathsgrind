"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GeneratedQuestion } from "@/types/question";
import { MathText } from "@/components/ui/math-text";
import { ExplanationResult, ExplanationStyle } from "@/lib/explanations/explanation-engine";
import { TMUA_QUESTIONS } from "@/data/questions/tmua-bank";
import {
  SessionMode,
  addExplainBack,
  getProfile,
  parseProfile,
  recordAttempt,
  updateSettings,
  useProfileSnapshot,
} from "@/lib/profile/student-profile";
import { autoFeedbackDepth, buildHints, maxHintDepth } from "@/lib/learning/hints";
import { dueTopics, diagnoseTopics, priorities } from "@/lib/learning/diagnosis";
import { SessionRecord, saveSessionRecord } from "@/lib/db/session-db";
import { badgeCommandWords, precisionFlags } from "@/lib/exam/command-words";
import { MarkAward, StepVerdict, awardMarks } from "@/lib/exam/mark-scheme";
import { specForChapter } from "@/data/chapters/spec-map";
import {
  AttemptGate,
  ConfidencePicker,
  ExplainBack,
  HintLadder,
  MarkAwardPanel,
  PrecisionFlags,
  StepVerdictList,
  WorkingEntry,
} from "@/components/practice/panels";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Flag,
  History,
  Layers,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  XCircle,
} from "lucide-react";

type Phase = "setup" | "quiz" | "summary";
type CheckStatus = "idle" | "checking" | "checked";
type Conditions = "gentle" | "realistic" | "strict";

interface QuestionResult {
  correct: boolean;
  userAnswer: string;
  marksAwarded: number;
  marksAvailable: number;
  flags: string[];
  timeSeconds: number;
  workingUsed: boolean;
  stepsMatched: number;
  chapter: string;
  title: string;
}

interface SessionState {
  questions: GeneratedQuestion[];
  index: number;
  score: number;
  mode: SessionMode;
  conditions: Conditions;
  questionStart: number;
  startedAt?: number;
  results: QuestionResult[];
}

const STORAGE_KEY = "edexcel-practice-session";
const FOUNDATION_CHAPTERS = [
  "Algebra and functions",
  "Numerical methods",
  "Exponentials and logarithms",
];

let storedRaw: string | null | undefined;

function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("session-update", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("session-update", onChange);
  };
}

function readStoredSession(): string | null {
  if (storedRaw === undefined) {
    try {
      storedRaw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      storedRaw = null;
    }
  }
  return storedRaw;
}

function readServerStoredSession(): string | null {
  return null;
}

function writeStoredSession(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // storage full/unavailable — non-fatal
  }
  storedRaw = value;
  window.dispatchEvent(new Event("session-update"));
}

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "any", label: "Mixed" },
];

const MODULES = [
  { value: "pure", label: "Pure" },
  { value: "statistics", label: "Statistics" },
  { value: "mechanics", label: "Mechanics" },
  { value: "any", label: "All" },
];

const COUNTS = [4, 6, 10];

const MODES: Array<{
  value: SessionMode;
  label: string;
  blurb: string;
  icon: typeof Layers;
}> = [
  { value: "practice", label: "Practice", blurb: "Topic-tagged questions, full feedback", icon: BookOpen },
  { value: "mixed", label: "Mixed", blurb: "Topics hidden — choose the method yourself", icon: Shuffle },
  { value: "timed", label: "Timed", blurb: "Exam clock, terse feedback, pace tracking", icon: Timer },
  { value: "mistakes", label: "Mistakes", blurb: "Re-test errors when they're due", icon: History },
  { value: "foundation", label: "Foundations", blurb: "GCSE refresh — fix the root gaps", icon: Sparkles },
];

const CONDITION_OPTIONS: Array<{ value: Conditions; label: string }> = [
  { value: "gentle", label: "Gentle" },
  { value: "realistic", label: "Realistic" },
  { value: "strict", label: "Strict" },
];

const FEEDBACK_OPTIONS: Array<{ value: "auto" | "detailed" | "terse"; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "detailed", label: "Full steps" },
  { value: "terse", label: "One-liner" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

async function fetchQuestions(params: {
  difficulty?: string;
  questionType?: string;
  chapter?: string;
  count: number;
}): Promise<GeneratedQuestion[]> {
  const sp = new URLSearchParams();
  if (params.difficulty) sp.set("difficulty", params.difficulty);
  if (params.questionType) sp.set("questionType", params.questionType);
  if (params.chapter) sp.set("chapter", params.chapter);
  sp.set("count", String(params.count));
  const res = await fetch(`/api/questions?${sp.toString()}`);
  const data = await res.json();
  return (data.questions || []) as GeneratedQuestion[];
}

function normaliseMode(raw: string | null): SessionMode | null {
  if (raw === "tmua") return "tmua";
  if (raw === "mixed" || raw === "timed" || raw === "mistakes" || raw === "foundation") {
    return raw;
  }
  if (raw === "practice") return "practice";
  return null;
}

function buildSessionRecord(session: SessionState, abandoned: boolean): SessionRecord {
  const startedAt = session.startedAt ?? session.questionStart;
  const marksAwarded = session.results.reduce((s, r) => s + r.marksAwarded, 0);
  const marksAvailable = session.results.reduce((s, r) => s + r.marksAvailable, 0);
  const totalTime = session.results.reduce((s, r) => s + r.timeSeconds, 0);
  const totalMarksAnswered = session.results.reduce(
    (s, r) => s + Math.max(1, r.marksAvailable),
    0
  );
  const pace = totalTime > 0 ? (totalMarksAnswered / totalTime) * 60 : 0;
  const slowCount = session.results.filter(
    (r, i) => r.timeSeconds > (session.questions[i]?.marks ?? 3) * 90 && !r.correct
  ).length;
  const byChapter = new Map<string, { seen: number; correct: number }>();
  for (const r of session.results) {
    const cur = byChapter.get(r.chapter) || { seen: 0, correct: 0 };
    cur.seen++;
    cur.correct += r.correct ? 1 : 0;
    byChapter.set(r.chapter, cur);
  }
  const strongest = [...byChapter.entries()]
    .map(([chapter, v]) => ({ chapter, ...v }))
    .filter((v) => v.correct > 0)
    .sort((a, b) => b.correct / b.seen - a.correct / a.seen)[0]?.chapter ?? null;

  return {
    id: `s-${startedAt}`,
    startedAt,
    finishedAt: Date.now(),
    abandoned,
    mode: session.mode,
    conditions: session.conditions ?? null,
    count: session.questions.length,
    attempts: session.results.length,
    correct: session.score,
    marksAwarded,
    marksAvailable,
    pace,
    slowCount,
    strongest,
    results: session.results.map((r) => ({
      correct: r.correct,
      marksAwarded: r.marksAwarded,
      marksAvailable: r.marksAvailable,
      timeSeconds: r.timeSeconds,
      chapter: r.chapter,
      title: r.title,
    })),
  };
}

function PracticeInner() {
  const searchParams = useSearchParams();
  const chapterFilter = searchParams.get("chapter");
  const urlMode = normaliseMode(searchParams.get("mode"));

  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<SessionMode>(urlMode ?? "practice");
  const [conditions, setConditions] = useState<Conditions>("gentle");
  const [difficulty, setDifficulty] = useState("medium");
  const [module, setModule] = useState("pure");
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);

  const [session, setSession] = useState<SessionState | null>(null);

  const profileRaw = useProfileSnapshot();
  const profile = useMemo(() => parseProfile(profileRaw), [profileRaw]);

  const stored = useSyncExternalStore(
    subscribeToSession,
    readStoredSession,
    readServerStoredSession
  );
  const savedSession = useMemo<SessionState | null>(() => {
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as SessionState;
      if (parsed.questions?.length && parsed.index < parsed.questions.length) {
        return {
          ...parsed,
          mode: parsed.mode ?? "practice",
          conditions: parsed.conditions ?? "gentle",
          questionStart: 0,
        };
      }
    } catch {
      // corrupt storage — treat as absent
    }
    return null;
  }, [stored]);

  const [answer, setAnswer] = useState("");
  const [working, setWorking] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [verdict, setVerdict] = useState<{ correct: boolean } | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [fullSolution, setFullSolution] = useState<ExplanationResult | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [flags, setFlags] = useState<string[]>([]);
  const [award, setAward] = useState<MarkAward | null>(null);
  const [stepVerdicts, setStepVerdicts] = useState<StepVerdict[]>([]);
  const [lastCheck, setLastCheck] = useState<{ correct: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== "quiz") return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [phase]);

  const saveSession = useCallback((s: SessionState) => {
    writeStoredSession(JSON.stringify(s));
  }, []);

  const startSession = useCallback(
    async (opts?: { mode?: SessionMode; count?: number; conditions?: Conditions }) => {
      setLoading(true);
      try {
        const m = opts?.mode ?? mode;
        const c = opts?.count ?? count;
        const conds = opts?.conditions ?? conditions;
        let questions: GeneratedQuestion[] = [];

        if (m === "tmua") {
          questions = shuffle(TMUA_QUESTIONS).slice(0, c);
        } else if (m === "mistakes") {
          const p = getProfile();
          questions = p.errorLog.map((e) => e.question).slice(0, c);
          if (questions.length < c) {
            const diag = diagnoseTopics(p);
            const chapters = [
              ...new Set([
                ...dueTopics(p).map((d) => d.chapter),
                ...priorities(p, diag).map((x) => x.chapter),
              ]),
            ].slice(0, 3);
            const have = new Set(questions.map((q) => q.id));
            for (const ch of chapters) {
              if (questions.length >= c) break;
              const extra = await fetchQuestions({
                chapter: ch,
                difficulty: "any",
                count: c - questions.length,
              });
              for (const q of extra) {
                if (!have.has(q.id) && questions.length < c) {
                  have.add(q.id);
                  questions.push(q);
                }
              }
            }
          }
          if (questions.length === 0) {
            questions = await fetchQuestions({ difficulty, count: c });
          }
        } else if (m === "foundation") {
          const per = Math.ceil(c / FOUNDATION_CHAPTERS.length);
          const batches = await Promise.all(
            FOUNDATION_CHAPTERS.map((ch) =>
              fetchQuestions({ difficulty: "easy", chapter: ch, count: per })
            )
          );
          questions = shuffle(batches.flat()).slice(0, c);
        } else {
          questions = await fetchQuestions({
            difficulty: m === "mixed" ? "any" : difficulty,
            questionType: module !== "any" ? module : undefined,
            chapter: chapterFilter || undefined,
            count: c,
          });
        }

        if (questions.length === 0) return;
        const fresh: SessionState = {
          questions,
          index: 0,
          score: 0,
          mode: m,
          conditions: conds,
          questionStart: Date.now(),
          startedAt: Date.now(),
          results: [],
        };
        setSession(fresh);
        saveSession(fresh);
        setPhase("quiz");
        setAnswer("");
        setWorking("");
        setStatus("idle");
        setVerdict(null);
        setExplanation(null);
        setFullSolution(null);
        setSolutionOpen(false);
        setHintsUsed(0);
        setConfidence(undefined);
        setFlags([]);
        setAward(null);
        setStepVerdicts([]);
        setLastCheck(null);
        setNow(Date.now());
        setTimeout(() => inputRef.current?.focus(), 50);
      } finally {
        setLoading(false);
      }
    },
    [mode, conditions, difficulty, module, count, chapterFilter, saveSession]
  );

  const resumeSession = useCallback(() => {
    if (!savedSession) return;
    setSession({ ...savedSession, questionStart: Date.now() });
    setPhase("quiz");
    setAnswer("");
    setWorking("");
    setStatus("idle");
    setVerdict(null);
    setExplanation(null);
    setFullSolution(null);
    setSolutionOpen(false);
    setHintsUsed(0);
    setConfidence(undefined);
    setFlags([]);
    setAward(null);
    setStepVerdicts([]);
    setLastCheck(null);
    setNow(Date.now());
  }, [savedSession]);

  const current = session?.questions[session.index];

  const resolveStyle = useCallback(
    (chapter: string): ExplanationStyle => {
      const pref = profile.settings.feedbackStyle;
      if (pref === "terse") return "terse";
      if (pref === "detailed") return "full";
      if (session?.mode === "timed" && session.conditions !== "gentle") return "terse";
      return autoFeedbackDepth(profile, chapter);
    },
    [profile, session]
  );

  const hints = useMemo(
    () => (current ? buildHints(current) : []),
    [current]
  );
  const hintAllowed = !(session?.mode === "timed" && session?.conditions === "strict");
  const hintCeiling = current ? maxHintDepth(profile, current.chapter) : 4;

  const submitAnswer = useCallback(async () => {
    if (!session || !current || status !== "idle" || !answer.trim()) return;
    setStatus("checking");
    try {
      const lines = working
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 8);
      const checkRes = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer: answer,
          correctAnswer: String(current.answer),
          working: lines,
          referenceSteps: current.steps,
        }),
      });
      const check = await checkRes.json();
      const correct = !!check.correct;
      const verdicts: StepVerdict[] = check.steps || [];
      const questionFlags = precisionFlags(current, answer);
      const computedAward = awardMarks(current, {
        correct,
        hasWorking: lines.length > 0,
        stepVerdicts: verdicts,
        hintDepth: 0,
      });
      const timeSeconds = (Date.now() - session.questionStart) / 1000;

      setLastCheck({ correct });
      setFlags(questionFlags);
      setAward(computedAward);
      setStepVerdicts(verdicts);
      setVerdict({ correct });
      setStatus("checked");
      setSolutionOpen(false);
      setHintsUsed(0);
      setConfidence(undefined);

      const updated: SessionState = {
        ...session,
        score: session.score + (correct ? 1 : 0),
        results: [
          ...session.results,
          {
            correct,
            userAnswer: answer,
            marksAwarded: computedAward.totalAwarded,
            marksAvailable: computedAward.totalAvailable,
            flags: questionFlags,
            timeSeconds,
            workingUsed: lines.length > 0,
            stepsMatched: verdicts.filter((v) => v.verdict === "match").length,
            chapter: current.chapter,
            title: current.title,
          },
        ],
      };
      setSession(updated);
      saveSession(updated);

      if (!correct) {
        const style = resolveStyle(current.chapter);
        const spec = specForChapter(current.chapter);
        const expRes = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: current,
            userAnswer: answer,
            correct,
            style,
            prereqGaps: spec.prerequisites.slice(0, 2),
          }),
        });
        const expData = await expRes.json();
        setExplanation(expData.explanation || null);
      } else if (resolveStyle(current.chapter) !== "terse") {
        const expRes = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: current,
            userAnswer: answer,
            correct,
            style: resolveStyle(current.chapter),
          }),
        });
        const expData = await expRes.json();
        setExplanation(expData.explanation || null);
      }
    } catch {
      setVerdict({ correct: false });
      setStatus("checked");
    }
  }, [session, current, status, answer, working, saveSession, resolveStyle]);

  const loadFullSolution = useCallback(async () => {
    if (!current || fullSolution) {
      setSolutionOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: current,
          userAnswer: answer,
          correct: !!lastCheck?.correct,
          style: "full",
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation || null);
      setFullSolution(data.explanation || null);
    } catch {
      // show whatever we already have
    }
    setSolutionOpen(true);
  }, [current, fullSolution, answer, lastCheck]);

  const nextQuestion = useCallback(() => {
    if (!session || !current || !verdict) return;

    recordAttempt({
      question: current,
      correct: verdict.correct,
      timeSeconds: (Date.now() - session.questionStart) / 1000,
      hintsUsed,
      confidence,
      misconception: verdict.correct ? undefined : explanation?.tag,
      workingUsed: stepVerdicts.length > 0 || working.trim().length > 0,
      workingMatchedSteps: stepVerdicts.filter((v) => v.verdict === "match").length,
      mode: session.mode,
      answerFlags: flags,
    });

    if (session.index + 1 >= session.questions.length) {
      void saveSessionRecord(buildSessionRecord(session, false));
      setPhase("summary");
      writeStoredSession(null);
      return;
    }
    const updated: SessionState = {
      ...session,
      index: session.index + 1,
      questionStart: Date.now(),
    };
    setSession(updated);
    saveSession(updated);
    setAnswer("");
    setWorking("");
    setStatus("idle");
    setVerdict(null);
    setLastCheck(null);
    setExplanation(null);
    setFullSolution(null);
    setSolutionOpen(false);
    setHintsUsed(0);
    setConfidence(undefined);
    setFlags([]);
    setAward(null);
    setStepVerdicts([]);
    setNow(Date.now());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [session, current, verdict, hintsUsed, confidence, explanation, stepVerdicts, working, flags, saveSession]);

  const quitToSetup = useCallback(() => {
    if (session && session.results.length > 0) {
      void saveSessionRecord(buildSessionRecord(session, true));
    }
    setPhase("setup");
    setSession(null);
    writeStoredSession(null);
  }, [session]);

  const changeFeedback = useCallback(
    (value: "auto" | "detailed" | "terse") => {
      updateSettings({ feedbackStyle: value });
    },
    []
  );

  const dueCount = useMemo(() => dueTopics(profile).length, [profile]);
  const errorCount = profile.errorLog.length;

  /* --------------------------------- SETUP -------------------------------- */

  if (phase === "setup") {
    const tmuaIntro = urlMode === "tmua";
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">
          {tmuaIntro ? "TMUA extension practice" : "Practice"}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {tmuaIntro
            ? "Admissions-test style problems — unfamiliar, proof-flavoured, and designed to make you think, not compute."
            : "Past-paper style questions with examiner marking, instant feedback and spaced re-testing of what you get wrong."}
        </p>

        {chapterFilter && mode !== "foundation" && mode !== "mistakes" && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm dark:border-blue-800 dark:bg-blue-950/40">
            <span>
              Practising: <strong>{chapterFilter}</strong>
            </span>
            <Link
              href="/practice"
              className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-300"
            >
              Clear
            </Link>
          </div>
        )}

        {savedSession && (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
            <p className="font-medium">
              Unfinished session: question {savedSession.index + 1} of{" "}
              {savedSession.questions.length} ({savedSession.score} correct so far)
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={resumeSession}
                className="h-11 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Resume session
              </button>
              <button
                onClick={() => writeStoredSession(null)}
                className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {(dueCount > 0 || errorCount > 0) && !savedSession && (
          <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/40">
            {dueCount > 0 && (
              <p className="font-medium text-emerald-900 dark:text-emerald-200">
                {dueCount} topic{dueCount > 1 ? "s are" : " is"} due for spaced review
                today.
              </p>
            )}
            {errorCount > 0 && (
              <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                {errorCount} past mistake{errorCount > 1 ? "s" : ""} waiting to be
                re-tested.
              </p>
            )}
            <button
              onClick={() => setMode("mistakes")}
              className="mt-2 h-9 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Use Mistakes mode
            </button>
          </div>
        )}

        <div className="mt-8 space-y-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Session type
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MODES.map((mo) => {
                const Icon = mo.icon;
                const active = mode === mo.value;
                return (
                  <button
                    key={mo.value}
                    onClick={() => setMode(mo.value)}
                    className={`flex min-h-[76px] flex-col items-start rounded-md border p-3 text-left transition-colors ${
                      active
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50"
                        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Icon className="h-4 w-4" /> {mo.label}
                    </span>
                    <span className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                      {mo.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
            {mode === "foundation" && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                Starting where A-Level gaps actually come from: brackets, indices,
                solving equations. Short, low-stakes, no judgment.
              </p>
            )}
            {mode === "mistakes" && errorCount === 0 && (
              <p className="mt-2 text-sm text-zinc-500">
                Nothing in your error log yet — we&apos;ll pull from your weakest
                topics instead.
              </p>
            )}
            {mode === "tmua" && (
              <p className="mt-2 text-sm text-zinc-500">
                Also available as its own page with proof technique and Further
                Maths bridging:{" "}
                <Link href="/tmua" className="text-blue-600 underline">
                  /tmua
                </Link>
              </p>
            )}
          </fieldset>

          {mode === "timed" && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Exam conditions (gradual exposure)
              </legend>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setConditions(c.value)}
                    className={`h-11 min-w-24 rounded-md border px-4 text-sm font-medium transition-colors ${
                      conditions === c.value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    }`}
                    aria-pressed={conditions === c.value}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {conditions === "gentle"
                  ? "Gentle: clock runs, hints and full worked solutions available."
                  : conditions === "realistic"
                    ? "Realistic: clock runs, one-line feedback like a mark scheme — hints still available."
                    : "Strict: countdown at 1 mark/min, no hints. Build up to this when you're ready."}
              </p>
            </fieldset>
          )}

          {mode !== "mistakes" && mode !== "foundation" && mode !== "tmua" && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Difficulty
              </legend>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`h-11 min-w-20 rounded-md border px-4 text-sm font-medium transition-colors ${
                      difficulty === d.value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    }`}
                    aria-pressed={difficulty === d.value}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {mode !== "mistakes" && mode !== "foundation" && mode !== "tmua" && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Module
              </legend>
              <div className="flex flex-wrap gap-2">
                {MODULES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setModule(m.value)}
                    className={`h-11 min-w-24 rounded-md border px-4 text-sm font-medium transition-colors ${
                      module === m.value
                        ? m.value === "statistics"
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : m.value === "mechanics"
                            ? "border-amber-600 bg-amber-600 text-white"
                            : "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    }`}
                    aria-pressed={module === m.value}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Questions
            </legend>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`h-11 min-w-16 rounded-md border px-4 text-sm font-medium transition-colors ${
                    count === c
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                  aria-pressed={count === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Feedback depth
            </legend>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => changeFeedback(f.value)}
                  className={`h-11 rounded-md border px-4 text-sm font-medium transition-colors ${
                    profile.settings.feedbackStyle === f.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                  aria-pressed={profile.settings.feedbackStyle === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Auto adapts to how well you know each topic — full worked examples
              early, one-liners once you&apos;re secure (fading scaffolds).
            </p>
          </fieldset>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => startSession()}
              disabled={loading}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Preparing questions…" : "Start session"}
            </button>
            <button
              onClick={() => startSession({ mode: "timed", count: 4, conditions: "gentle" })}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
              title="4 questions, ~10 minutes, gentle timing"
            >
              <Clock className="h-4 w-4" /> 10-minute quick set
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------- SUMMARY -------------------------------- */

  if (phase === "summary" && session) {
    const total = session.questions.length;
    const correct = session.score;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const perfect = correct === total;
    const marksAwarded = session.results.reduce((s, r) => s + r.marksAwarded, 0);
    const marksAvailable = session.results.reduce((s, r) => s + r.marksAvailable, 0);
    const totalTime = session.results.reduce((s, r) => s + r.timeSeconds, 0);
    const totalMarksAnswered = session.results.reduce(
      (s, r) => s + Math.max(1, r.marksAvailable),
      0
    );
    const pace = totalTime > 0 ? (totalMarksAnswered / totalTime) * 60 : 0;
    const slowQuestions = session.results.filter(
      (r, i) =>
        r.timeSeconds > (session.questions[i]?.marks ?? 3) * 90 && !r.correct
    );
    const sessionByChapter = new Map<string, { seen: number; correct: number }>();
    for (const r of session.results) {
      const cur = sessionByChapter.get(r.chapter) || { seen: 0, correct: 0 };
      cur.seen++;
      cur.correct += r.correct ? 1 : 0;
      sessionByChapter.set(r.chapter, cur);
    }
    const strongest = [...sessionByChapter.entries()]
      .map(([chapter, v]) => ({ chapter, ...v }))
      .filter((v) => v.correct > 0)
      .sort((a, b) => b.correct / b.seen - a.correct / a.seen)[0];
    const wrongResults = session.results
      .map((r, i) => ({ r, q: session.questions[i] }))
      .filter((x) => x.q && !x.r.correct);

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
            <Target className="h-7 w-7 text-blue-700 dark:text-blue-300" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">
            {perfect ? "Perfect session" : `You scored ${correct}/${total}`}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {accuracy}% accuracy · {marksAwarded}/{marksAvailable} marks{" "}
            {marksAvailable > 0 ? "(examiner marking)" : ""} · {fmtTime(totalTime)}{" "}
            spent
          </p>

          <div className="mt-4 grid gap-2 text-left sm:grid-cols-3">
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Pace</p>
              <p className="mt-1 text-lg font-bold">{pace.toFixed(1)} marks/min</p>
              <p className="text-xs text-zinc-500">benchmark: ~1.0</p>
            </div>
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Flagged</p>
              <p className="mt-1 text-lg font-bold">{slowQuestions.length} slow</p>
              <p className="text-xs text-zinc-500">over time + wrong</p>
            </div>
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Strongest</p>
              <p className="mt-1 truncate text-lg font-bold">
                {strongest ? strongest.chapter : "—"}
              </p>
              <p className="text-xs text-zinc-500">
                {strongest ? `${strongest.correct}/${strongest.seen} today` : "keep going"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-left">
            {session.results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <span className="truncate text-zinc-500">
                  {i + 1}. {r.title}
                  {r.flags.length > 0 && (
                    <Flag
                      className="ml-1 inline h-3 w-3 text-amber-600"
                      aria-label={r.flags.join(", ")}
                    />
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    {r.marksAwarded}/{r.marksAvailable} mk
                  </span>
                  {r.correct ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-medium text-red-700 dark:text-red-400">
                      <XCircle className="h-4 w-4" /> {r.userAnswer}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {wrongResults.length > 0
              ? `${wrongResults.length} question${wrongResults.length > 1 ? "s" : ""} will come back when spaced repetition says they're due.`
              : "Everything here is sticking — spaced repetition will spread the reviews out."}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => startSession()}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> New set of questions
            </button>
            {session.results.some((r) => !r.correct) && (
              <button
                onClick={() => startSession({ mode: "mistakes" })}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 px-6 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <History className="h-4 w-4" /> Retry the mistakes now
              </button>
            )}
            <button
              onClick={quitToSetup}
              className="h-12 rounded-md border border-zinc-300 px-6 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Change settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------- QUIZ ---------------------------------- */

  if (!session || !current) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p>Loading…</p>
      </div>
    );
  }

  const total = session.questions.length;
  const qNumber = session.index + 1;
  const elapsed = (now - session.questionStart) / 1000;
  const strictLimit = current.marks * 60;
  const remaining = strictLimit - elapsed;
  const hideTopic = session.mode === "mixed";
  const style = resolveStyle(current.chapter);
  const showExplanation =
    !!explanation &&
    (verdict?.correct ? style !== "terse" || solutionOpen : solutionOpen);
  const timeSpent =
    session.results[session.results.length - 1]?.timeSeconds ?? elapsed;
  const fragileCandidate =
    !!verdict?.correct &&
    (hintsUsed > 0 || (confidence !== undefined && confidence <= 2) || timeSpent < 8);
  const isLast = session.index + 1 >= total;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Score banner (serial position: primacy) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Question {qNumber} of {total}
          {session.mode !== "practice" && (
            <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {session.mode === "tmua"
                ? "TMUA"
                : session.mode === "foundation"
                  ? "Foundations"
                  : session.mode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          {session.mode === "timed" && (
            <span
              className={`flex items-center gap-1 tabular-nums ${
                session.conditions === "strict" && remaining < 30
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
              title={
                session.conditions === "strict"
                  ? "Countdown: 1 mark per minute"
                  : "Elapsed time"
              }
            >
              <Timer className="h-3.5 w-3.5" />
              {session.conditions === "strict"
                ? fmtTime(remaining)
                : fmtTime(elapsed)}
            </span>
          )}
          <span>
            Score {session.score}/{session.results.length}
          </span>
        </div>
      </div>

      {/* Progress (Zeigarnik + closure) */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${(session.results.length / total) * 100}%` }}
          role="progressbar"
          aria-valuenow={session.results.length}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!hideTopic && (
            <span className="rounded bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {current.chapter}
            </span>
          )}
          {!hideTopic && current.specPoint && (
            <span
              className="rounded bg-zinc-100 px-2 py-1 font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              title="9MA0 specification point"
            >
              {current.specPoint.split(" ")[0]}
            </span>
          )}
          <span className="rounded bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {current.marks} {current.marks === 1 ? "mark" : "marks"}
          </span>
          <span className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Clock className="h-3 w-3" /> ~{current.marks} min
          </span>
          <span className="rounded bg-zinc-100 px-2 py-1 font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
            {String(current.difficulty)}
          </span>
          {current.verified && (
            <span
              className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              title="This answer was independently re-derived by computer algebra (SymPy), not trusted from generation"
            >
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {badgeCommandWords(current).map((w) => (
            <span
              key={w}
              className="rounded bg-purple-100 px-2 py-1 font-medium capitalize text-purple-800 dark:bg-purple-950 dark:text-purple-300"
              title="Examiner command word — the mark scheme expects this specifically"
            >
              {w}
            </span>
          ))}
        </div>

        <div className="prose-math mt-4 text-lg leading-relaxed">
          <MathText>{current.questionText}</MathText>
        </div>

        {session.conditions === "strict" && remaining <= 0 && status === "idle" && (
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Time&apos;s up for this one — in the real paper you&apos;d move on.
            Finish it if you like; practice is for learning, not punishment.
          </p>
        )}

        {status !== "checked" && (
          <>
            <div className="mt-5 flex items-stretch gap-2 rounded-md border border-zinc-300 p-1 focus-within:border-blue-600 dark:border-zinc-700">
              <input
                ref={inputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && status === "idle") submitAnswer();
                }}
                placeholder="Type your answer (LaTeX like x^2 or (x+2)(x+3) both work)"
                className="h-11 flex-1 bg-transparent px-3 text-base outline-none"
                aria-label="Your answer"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={submitAnswer}
                disabled={status === "checking" || !answer.trim()}
                className="h-11 rounded bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {status === "checking" ? "Checking…" : "Check"}
              </button>
            </div>
            <AttemptGate attempted={false} />
            <WorkingEntry value={working} onChange={setWorking} />
          </>
        )}

        {verdict && status === "checked" && (
          <div
            className={`mt-5 rounded-md border-l-4 p-4 ${
              verdict.correct
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-red-600 bg-red-50 dark:bg-red-950/40"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {verdict.correct ? (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-emerald-800 dark:text-emerald-300">
                    Correct{style === "terse" ? "." : " — nice work"}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-700 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-300">
                    {style === "terse" ? "Not correct" : "Not quite"}
                  </span>
                </>
              )}
            </div>

            {!verdict.correct && (
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-zinc-500 line-through">{answer}</span>{" "}
                  <span className="text-zinc-400">→</span>{" "}
                  <span className="font-semibold">
                    <MathText>{String(current.answer)}</MathText>
                  </span>
                </p>
              </div>
            )}

            <PrecisionFlags flags={flags} />
            {award && <MarkAwardPanel award={award} />}
            {stepVerdicts.length > 0 && <StepVerdictList steps={stepVerdicts} />}

            {!verdict.correct && !solutionOpen && (
              <HintLadder
                hints={hints}
                maxDepth={hintCeiling}
                revealed={hintsUsed}
                onReveal={() => setHintsUsed((h) => Math.min(h + 1, hintCeiling))}
                onShowSolution={loadFullSolution}
                solutionOpen={solutionOpen}
                hintsAllowed={hintAllowed}
              />
            )}

            {showExplanation && explanation && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold">{explanation.headline}</p>
                {explanation.likelyMisconception && (
                  <p className="rounded bg-white/70 px-3 py-2 text-sm dark:bg-black/40">
                    <MathText>{explanation.likelyMisconception}</MathText>
                  </p>
                )}
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  <MathText>{explanation.explanation}</MathText>
                </p>

                {explanation.steps.length > 0 && (
                  <ol className="space-y-2">
                    {explanation.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded bg-white/70 px-3 py-2 text-sm dark:bg-black/40"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span>
                          <MathText>{`${step.title}: ${step.content}`}</MathText>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                {explanation.prerequisiteNote && (
                  <p className="rounded bg-amber-100/70 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                    <MathText>{explanation.prerequisiteNote}</MathText>
                  </p>
                )}

                {explanation.commonMistakes.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      Common mistakes in this topic:
                    </p>
                    <ul className="mt-1 list-inside list-disc text-zinc-600 dark:text-zinc-400">
                      {explanation.commonMistakes.map((m, i) => (
                        <li key={i}>
                          <MathText>{m}</MathText>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {verdict.correct && !solutionOpen && style === "terse" && (
              <button
                onClick={loadFullSolution}
                className="mt-3 text-sm font-medium text-blue-700 underline underline-offset-2 dark:text-blue-300"
              >
                How was it done?
              </button>
            )}

            {fragileCandidate && !solutionOpen && (
              <ExplainBack
                question={current}
                onDone={() => {
                  addExplainBack(current.id);
                }}
              />
            )}

            <ConfidencePicker value={confidence} onChange={setConfidence} />

            <button
              onClick={nextQuestion}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isLast ? "See results" : "Next question"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={quitToSetup}
        className="mt-4 text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        End session and change settings
      </button>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-zinc-500">Loading practice…</p>
        </div>
      }
    >
      <PracticeInner />
    </Suspense>
  );
}
