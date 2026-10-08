"use client";

import {
  CheckCircle,
  Flag,
  History,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { gradeForPaperPct, PAPER_GRADE_DISCLAIMER } from "@/lib/learning/grade-model";
import { SessionState } from "@/components/practice/session-types";

function fmtTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Props {
  session: SessionState;
  hideGradePredictions: boolean;
  loading: boolean;
  onStartNew: () => void;
  onRetryMistakes: () => void;
  onChangeSettings: () => void;
}

export function SessionSummary({
  session,
  hideGradePredictions,
  loading,
  onStartNew,
  onRetryMistakes,
  onChangeSettings,
}: Props) {
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
  const paperGrade =
    marksAvailable > 0
      ? gradeForPaperPct((marksAwarded / marksAvailable) * 100)
      : null;
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
          {marksAvailable > 0 ? "(examiner marking)" : ""} · {fmtTime(totalTime)} spent
        </p>
        {paperGrade && !hideGradePredictions && (
          <p className="mt-1 text-xs text-zinc-500">
            {paperGrade.pct}% of set marks →{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {paperGrade.band}
            </span>{" "}
            band on recent boundaries. {PAPER_GRADE_DISCLAIMER}
          </p>
        )}

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
            onClick={onStartNew}
            disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" /> New set of questions
          </button>
          {session.results.some((r) => !r.correct) && (
            <button
              onClick={onRetryMistakes}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 px-6 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <History className="h-4 w-4" /> Retry the mistakes now
            </button>
          )}
          <button
            onClick={onChangeSettings}
            className="h-12 rounded-md border border-zinc-300 px-6 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Change settings
          </button>
        </div>
      </div>
    </div>
  );
}