"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  GraduationCap,
  History,
  Printer,
  Target,
  Timer,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  parseProfile,
  resetProfile,
  setExamDate,
  updateSettings,
  useProfileSnapshot,
} from "@/lib/profile/student-profile";
import {
  TopicStatus,
  calibration,
  diagnoseTopics,
  dueTopics,
  estimateGrade,
  examPlan,
  gapAnalysis,
  needsHumanFlags,
  priorities,
  recurringMisconceptions,
  summaryStats,
} from "@/lib/learning/diagnosis";
import { exportAllData } from "@/lib/export-profile";
import {
  predictGrade,
  gradeForPaperPct,
  BOUNDARY_SOURCE,
} from "@/lib/learning/grade-model";
import { GradeModelView } from "@/components/progress/grade-model-view";
import { useActiveUserSnapshot } from "@/lib/profile/accounts";
import {
  SessionRecord,
  clearSessionRecords,
  listSessionRecords,
} from "@/lib/db/session-db";

const MODE_LABEL: Record<string, string> = {
  practice: "Practice",
  mixed: "Mixed",
  timed: "Timed",
  mistakes: "Mistakes",
  foundation: "Foundations",
  tmua: "TMUA",
};

function fmtDur(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

const STATUS_STYLE: Record<TopicStatus, { label: string; chip: string; bar: string }> = {
  unseen: { label: "Unseen", chip: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", bar: "bg-zinc-400" },
  developing: { label: "Developing", chip: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", bar: "bg-blue-500" },
  secure: { label: "Secure", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", bar: "bg-emerald-500" },
  "at-risk": { label: "At risk", chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", bar: "bg-amber-500" },
  gap: { label: "Gap", chip: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", bar: "bg-red-500" },
};

function SectionTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight">{children}</h2>
      {note && <span className="text-xs text-zinc-500">{note}</span>}
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}>
      {children}
    </section>
  );
}

function AccuracyBar({ value, bar }: { value: number; bar: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="tabular-nums text-sm">{Math.round(value * 100)}%</span>
    </div>
  );
}

function toDateInput(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ProgressPage() {
  const raw = useProfileSnapshot();
  const profile = useMemo(() => parseProfile(raw), [raw]);
  const activeUser = useActiveUserSnapshot();
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearSessions, setConfirmClearSessions] = useState(false);

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    void listSessionRecords(200, activeUser).then((rows) => {
      if (!alive) return;
      setSessions(rows);
      setSessionsReady(true);
    });
    const refresh = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      alive = false;
      window.clearInterval(refresh);
    };
  }, [activeUser]);

  const readSessions = () => {
    void listSessionRecords(200, activeUser).then((rows) => {
      setSessions(rows);
      setSessionsReady(true);
    });
  };

  const diags = useMemo(() => diagnoseTopics(profile), [profile]);
  const stats = useMemo(() => summaryStats(profile, diags), [profile, diags]);
  const gaps = useMemo(() => gapAnalysis(diags), [diags]);
  const grade = useMemo(() => estimateGrade(profile), [profile]);
  const pred = useMemo(
    () => predictGrade(profile, sessions, now),
    [profile, sessions, now]
  );
  const calib = useMemo(() => calibration(profile), [profile]);
  const top = useMemo(() => priorities(profile, diags), [profile, diags]);
  const human = useMemo(() => needsHumanFlags(profile, diags), [profile, diags]);
  const plan = useMemo(() => examPlan(profile, diags), [profile, diags]);
  const due = useMemo(() => dueTopics(profile), [profile]);
  const misconceptions = useMemo(() => recurringMisconceptions(profile), [profile]);

  const hasData = profile.attempts.length > 0;
  const attempted = diags.filter((d) => d.seen > 0);

  const reportText = () => {
    const lines: string[] = [];
    lines.push("Edexcel A-Level Maths — revision report");
    lines.push(`Generated ${new Date().toLocaleString()}`);
    if (profile.examDate) lines.push(`Exam date: ${new Date(profile.examDate).toDateString()}`);
    lines.push("");
    lines.push(
      `Questions attempted: ${stats.totalAttempts} · recent accuracy: ${stats.recentAccuracy ?? "—"}% · working days: ${stats.workingDays}`
    );
    if (grade) lines.push(`Grade estimate: ${grade.band} (range ${grade.range}, ${grade.confidence} confidence)`);
    if (pred.usable) lines.push(`Grade model: ${pred.predictedBand} (range ${pred.predictedRange?.join("–") ?? "—"}, ${pred.accuracy.toFixed(1)}% EWMA accuracy, ${pred.probabilities.filter((p) => p.p >= 0.1).map((p) => `${p.band} ${Math.round(p.p * 100)}%`).join(", ")})`);
    const sessionsPace =
      sessions.length > 0
        ? (sessions.filter((s) => !s.abandoned && s.pace > 0).reduce((sum, s) => sum + s.pace, 0) /
            Math.max(1, sessions.filter((s) => !s.abandoned && s.pace > 0).length)
          ).toFixed(2)
        : null;
    if (sessionsReady) lines.push(`Sessions: ${sessions.length} logged${sessionsPace ? ` · avg pace ${sessionsPace} marks/min` : ""}`);
    lines.push(`Topics: ${stats.topicsSecure} secure · ${stats.topicsGap} gap/at-risk · ${diags.length - stats.topicsAttempted} unseen`);
    lines.push("");
    lines.push(`Gap analysis: ${gaps.headline}`);
    if (top.length) {
      lines.push("Priorities:");
      for (const p of top.slice(0, 5)) lines.push(`  - ${p.chapter} (${p.score}) — ${p.reason}`);
    }
    if (human.length) {
      lines.push("Needs a human:");
      for (const f of human) lines.push(`  - ${f.message}`);
    }
    if (calib) lines.push(`Confidence: ${calib.message}`);
    if (due.length) lines.push(`Spaced review due: ${due.map((d) => d.chapter).join(", ")}`);
    lines.push("");
    lines.push("Estimates are rehearsal figures from in-app practice, not predictions.");
    return lines.join("\n");
  };

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the print view still works
    }
  }

  if (!hasData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <GraduationCap className="mx-auto h-10 w-10 text-zinc-400" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Account: {activeUser}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Your progress lives here</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Answer a few questions and this page fills up with an honest gap analysis, a rehearsal
          grade estimate, spaced-repetition due dates and a plan that works backwards from your
          exam date.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/practice"
            className="flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start practising <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/practice?mode=foundation"
            className="flex h-11 items-center rounded-md border border-zinc-300 px-5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Warm up on foundations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your progress</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {activeUser}&apos;s evidence-based picture — built from {stats.totalAttempts} recorded attempts.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={copyReport}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden /> {copied ? "Copied" : "Copy report"}
          </button>
          <button
            onClick={() => void exportAllData()}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            title="Download a JSON backup of this browser's profile and session log"
          >
            <Download className="h-3.5 w-3.5" aria-hidden /> Export data
          </button>
          <button
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden /> Print
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Questions", value: String(stats.totalAttempts) },
          { label: "Last 30 days", value: stats.recentAccuracy !== null ? `${stats.recentAccuracy}%` : "—" },
          { label: "Secure topics", value: String(stats.topicsSecure) },
          { label: "Gaps / at risk", value: String(stats.topicsGap) },
          { label: "Working days", value: String(stats.workingDays) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xl font-bold tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Grade prediction & modelling */}
        <Card>
          <div className="flex items-start justify-between gap-2">
            <SectionTitle note="modelled from your attempt history — never a promise">
              Grade prediction
            </SectionTitle>
            <button
              onClick={() =>
                updateSettings({
                  hideGradePredictions: !profile.settings.hideGradePredictions,
                })
              }
              className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                profile.settings.hideGradePredictions
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
              title="Hide grade estimates if they stress you out — practice continues to be tracked"
            >
              {profile.settings.hideGradePredictions ? "Grade estimates hidden" : "Hide grade estimates"}
            </button>
          </div>
          {profile.settings.hideGradePredictions ? (
            <div className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Grade estimates are hidden. Your attempts still feed the gap analysis,
              spaced review and priorities.
            </div>
          ) : pred.usable && pred.predictedBand ? (
            <GradeModelView pred={pred} />
          ) : (
            <div>
              <div className="text-sm text-zinc-500">{pred.reason}</div>
              {grade && (
                <div className="mt-4 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black tracking-tight">{grade.band}</span>
                    <span className="text-sm font-semibold text-zinc-500">rehearsal range {grade.range}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {grade.basis}
                  </p>
                </div>
              )}
            </div>
          )}
          {!profile.settings.hideGradePredictions && (
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Band boundaries: {BOUNDARY_SOURCE}.
            </p>
          )}
        </Card>

        {/* Gap analysis */}
        <Card>
          <SectionTitle note={gaps.estimatedCostPercent > 0 ? `~${gaps.estimatedCostPercent}% of paper marks at risk` : undefined}>
            Gap analysis
          </SectionTitle>
          <p className="text-sm font-medium leading-relaxed">{gaps.headline}</p>
          {gaps.weakest.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {gaps.weakest.map((w) => (
                <li key={w.chapter} className="flex items-center justify-between text-sm">
                  <Link href={`/practice?chapter=${encodeURIComponent(w.chapter)}`} className="hover:underline">
                    {w.chapter}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {w.accuracy}% over {w.seen} attempts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Exam plan */}
      <Card className="mt-4">
        <SectionTitle note={profile.examDate ? `exam ${new Date(profile.examDate).toDateString()}` : "optional"}>
          Exam plan
        </SectionTitle>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500" htmlFor="exam-date">
            Exam date
          </label>
          <input
            id="exam-date"
            type="date"
            value={toDateInput(profile.examDate)}
            onChange={(e) => {
              const v = e.target.value;
              setExamDate(v ? new Date(`${v}T23:59:00`).getTime() : undefined);
            }}
            className="h-9 rounded-md border border-zinc-300 px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {plan ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="text-lg font-bold tabular-nums">{plan.weeksLeft} weeks</div>
              <div className="text-xs text-zinc-500">
                {plan.sessionsPerWeek} sessions/week × {plan.minutesPerSession} min
              </div>
            </div>
            <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900 sm:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Focus topics</div>
              <ul className="mt-1 space-y-0.5 text-sm">
                {plan.focus.map((f) => (
                  <li key={f.chapter} className="flex justify-between">
                    <Link href={`/practice?chapter=${encodeURIComponent(f.chapter)}`} className="hover:underline">
                      {f.chapter}
                    </Link>
                    <span className="text-zinc-500">{f.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="space-y-1 text-xs text-zinc-500 sm:col-span-3">
              {plan.microSessions.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Set an exam date to get a backwards-planned schedule — or keep the pace shown below.
          </p>
        )}
      </Card>

      {/* Priorities */}
      <Card className="mt-4">
        <SectionTitle note="exam weight × weakness × due-ness">Do these next</SectionTitle>
        {top.length === 0 ? (
          <p className="text-sm text-zinc-500">Attempt a few questions to generate priorities.</p>
        ) : (
          <ol className="space-y-2">
            {top.slice(0, 5).map((p, i) => (
              <li key={p.chapter} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-bold text-zinc-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/practice?chapter=${encodeURIComponent(p.chapter)}`} className="truncate text-sm font-semibold hover:underline">
                      {p.chapter}
                    </Link>
                    <span className="shrink-0 text-xs text-zinc-500">{p.reason}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, p.score)}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/practice?chapter=${encodeURIComponent(p.chapter)}`}
                  className="shrink-0 rounded bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Practise
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Topic table */}
      <Card className="mt-4">
        <SectionTitle note={`${attempted.length} of ${diags.length} topics attempted`}>Topics</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Topic</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Accuracy</th>
                <th className="py-2 pr-3 font-semibold">Tried</th>
                <th className="py-2 pr-3 font-semibold">Sec/mk</th>
                <th className="py-2 font-semibold">Review</th>
              </tr>
            </thead>
            <tbody>
              {diags.map((d) => {
                const s = STATUS_STYLE[d.status];
                return (
                  <tr key={d.chapter} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <td className="py-2 pr-3">
                      <Link href={`/practice?chapter=${encodeURIComponent(d.chapter)}`} className="font-medium hover:underline">
                        {d.chapter}
                      </Link>
                      <div className="text-xs text-zinc-400">{d.specCode}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.chip}`}>{s.label}</span>
                      {d.slow && (
                        <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800" title="Slower than 1 mark/min benchmark">
                          slow
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {d.seen > 0 ? <AccuracyBar value={d.accuracy} bar={s.bar} /> : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-zinc-500">{d.seen}</td>
                    <td className="py-2 pr-3 tabular-nums text-zinc-500">{d.secPerMark !== null ? Math.round(d.secPerMark) : "—"}</td>
                    <td className="py-2 text-xs text-zinc-500">
                      {d.due ? (
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          due{d.nextReviewInDays !== null && d.nextReviewInDays > 0 ? ` in ${d.nextReviewInDays}d` : ""}
                        </span>
                      ) : d.nextReviewInDays !== null ? (
                        `in ${d.nextReviewInDays}d`
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {stats.topicsGap > 0 && (
          <p className="mt-3 text-sm">
            <Target className="mr-1 inline h-4 w-4 align-text-bottom text-red-500" aria-hidden />
            Weak on GCSE prerequisites?{" "}
            <Link href="/practice?mode=foundation" className="font-semibold text-blue-700 hover:underline dark:text-blue-300">
              Run a foundations warm-up
            </Link>{" "}
            — gaps in prerequisite skills explain most topic failures.
          </p>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Spaced review */}
        <Card>
          <SectionTitle note={due.length ? `${due.length} due` : "nothing due"}>Spaced review</SectionTitle>
          {due.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No reviews due — the schedule brings topics back at 1, 3, 7, 14, 30 and 60 days.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {due.slice(0, 6).map((d) => (
                <li key={d.chapter} className="flex items-center justify-between gap-2">
                  <Link href={`/practice?chapter=${encodeURIComponent(d.chapter)}`} className="truncate hover:underline">
                    {d.chapter}
                  </Link>
                  <span className="shrink-0 text-xs text-zinc-500">was {d.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
          {due.length > 0 && (
            <Link
              href="/practice?mode=mistakes"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
            >
              Review now <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </Card>

        {/* Calibration + misconceptions */}
        <Card>
          <SectionTitle note="recurring wrong-answer patterns — possible causes, not diagnoses">Confidence & patterns</SectionTitle>
          {calib ? (
            <p className="text-sm leading-relaxed">{calib.message}</p>
          ) : (
            <p className="text-sm text-zinc-500">
              Rate confidence after each answer — an over/under-confidence read appears once you
              have a handful of ratings.
            </p>
          )}
          {misconceptions.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {misconceptions.map((m) => (
                <li
                  key={m.tag}
                  className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                >
                  {m.tag} × {m.count}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Error log */}
      {profile.errorLog.length > 0 && (
        <Card className="mt-4">
          <SectionTitle note="full question snapshots, kept for re-testing">Missed questions</SectionTitle>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {profile.errorLog.slice(0, 8).map((e, i) => (
              <li key={`${e.question.id}-${i}`} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.question.title}</div>
                  <div className="text-xs text-zinc-500">
                    {e.question.chapter} · missed {e.count}× · last {new Date(e.date).toLocaleDateString()}
                    {e.misconception ? ` · ${e.misconception}` : ""}
                  </div>
                </div>
                <Link
                  href="/practice?mode=mistakes"
                  className="shrink-0 rounded border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Re-test
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Session log */}
      <Card className="mt-4">
        <SectionTitle note={sessionsReady ? `${sessions.length} session${sessions.length === 1 ? "" : "s"} in the database` : "IndexedDB log"}>
          Session log
        </SectionTitle>
        {!sessionsReady ? (
          <p className="text-sm text-zinc-500">Loading the session log…</p>
        ) : sessions.length === 0 ? (
          <div>
            <p className="text-sm text-zinc-500">
              No sessions logged yet. Complete a practice set and it lands here with date, mode,
              accuracy, marks and pace — that&apos;s what&apos;s feeding the prediction model.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/practice"
                className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Timer className="h-3.5 w-3.5" aria-hidden /> Start a session
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Sessions", value: String(sessions.length) },
                {
                  label: "This week",
                  value: String(
                    sessions.filter((s) => s.startedAt > now - 7 * 24 * 60 * 60 * 1000).length
                  ),
                },
                {
                  label: "Avg pace",
                  value: (() => {
                    const paced = sessions.filter((s) => !s.abandoned && s.pace > 0);
                    return paced.length > 0
                      ? `${(paced.reduce((sum, s) => sum + s.pace, 0) / paced.length).toFixed(2)} mk/min`
                      : "—";
                  })(),
                },
                {
                  label: "Best accuracy",
                  value: (() => {
                    const done = sessions.filter((s) => !s.abandoned && s.attempts >= 3);
                    if (done.length === 0) return "—";
                    const best = Math.max(...done.map((s) => (s.correct / s.attempts) * 100));
                    return `${Math.round(best)}%`;
                  })(),
                },
              ].map((s) => (
                <div key={s.label} className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
                  <div className="text-base font-bold tabular-nums">{s.value}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-900">
              {sessions.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {MODE_LABEL[s.mode] ?? s.mode}
                      </span>
                      {s.abandoned && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          abandoned
                        </span>
                      )}
                      <span className="truncate font-medium">
                        {new Date(s.startedAt).toLocaleDateString()}{" "}
                        {new Date(s.startedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {s.attempts}/{s.count} answered · {MODE_LABEL[s.mode] ?? s.mode}
                      {s.conditions ? `· ${s.conditions}` : ""}
                      {s.strongest ? ` · best: ${s.strongest}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={s.correct === s.attempts && s.attempts >= 3 ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-medium"}>
                      {s.correct}/{s.attempts} correct
                    </div>
                    <div className="text-xs text-zinc-500">
                      {s.marksAwarded}/{s.marksAvailable} mk
                      {s.marksAvailable > 0 && !profile.settings.hideGradePredictions
                        ? ` · ${gradeForPaperPct((s.marksAwarded / s.marksAvailable) * 100).band}`
                        : ""}{" "}
                      · {fmtDur(s.results.reduce((sum, r) => sum + r.timeSeconds, 0))} · {s.pace.toFixed(1)} mk/min
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {sessions.length > 8 && (
              <p className="mt-2 text-xs text-zinc-500">
                Showing the latest 8 of {sessions.length} — the database keeps every session.
              </p>
            )}
            {!profile.settings.hideGradePredictions && (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                Band letters convert each session&apos;s marks percentage through {BOUNDARY_SOURCE} — a
                short set is not a full paper, so treat them as a rough conversion.
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 print:hidden">
              {confirmClearSessions ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Erase the session log from this browser?
                  </span>
                  <button
                    onClick={() => {
                      void clearSessionRecords().then(readSessions);
                      setConfirmClearSessions(false);
                    }}
                    className="rounded bg-red-600 px-2.5 py-1.5 font-semibold text-white hover:bg-red-700"
                  >
                    Yes, erase
                  </button>
                  <button
                    onClick={() => setConfirmClearSessions(false)}
                    className="rounded border border-zinc-300 px-2.5 py-1.5 font-semibold hover:bg-zinc-50 dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearSessions(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600"
                >
                  <History className="h-3.5 w-3.5" aria-hidden /> Clear session log
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Needs a human */}
      {human.length > 0 && (
        <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/40">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Worth a human
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {human.map((f) => (
              <li key={f.message}>• {f.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* End-of-page controls (peak-end) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-2">
          <Link
            href="/practice?mode=mistakes"
            className="flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Timer className="h-4 w-4" aria-hidden /> Fix my mistakes
          </Link>
          <Link
            href="/practice"
            className="flex h-10 items-center gap-1.5 rounded-md border border-zinc-300 px-4 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <TrendingUp className="h-4 w-4" aria-hidden /> New session
          </Link>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Erase all local data?</span>
            <button
              onClick={() => {
                resetProfile();
                void clearSessionRecords().then(readSessions);
                setConfirmReset(false);
              }}
              className="rounded bg-red-600 px-2.5 py-1.5 font-semibold text-white hover:bg-red-700"
            >
              Yes, erase
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded border border-zinc-300 px-2.5 py-1.5 font-semibold hover:bg-zinc-50 dark:border-zinc-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Reset local data
          </button>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Every answer is machine-verified (maths checked in code, not by a language model), and
          grade figures above are rehearsal estimates from in-app practice — Edexcel grade
          boundaries vary by paper.
        </span>
      </div>

      {/* Print-only header spacer so printed reports read cleanly */}
      <div className="hidden print:block">
        <div className="mt-6 text-xs text-zinc-500">
          <Calendar className="mr-1 inline h-3 w-3" aria-hidden />
          Report from the Edexcel A-Level Maths revision app.
        </div>
      </div>
    </div>
  );
}
