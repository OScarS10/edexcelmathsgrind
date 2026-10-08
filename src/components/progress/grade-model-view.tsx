"use client";

import { GradePrediction } from "@/lib/learning/grade-model";

export function GradeModelView({ pred }: { pred: GradePrediction }) {
  const activityTone =
    pred.activity === "improving"
      ? "text-emerald-700 dark:text-emerald-400"
      : pred.activity === "declining"
        ? "text-red-700 dark:text-red-400"
        : "text-zinc-500";
  const activityLabel =
    pred.activity === "improving"
      ? `+${pred.improvementPerWeek.toFixed(1)} pts/wk`
      : pred.activity === "declining"
        ? `${pred.improvementPerWeek.toFixed(1)} pts/wk`
        : "steady";
  const ci = pred.interval
    ? `${Math.round(pred.interval.lo)}–${Math.round(pred.interval.hi)}%`
    : "—";
  const probs = [...pred.probabilities].sort((a, b) => b.p - a.p).slice(0, 4);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-black tracking-tight">{pred.predictedBand}</span>
        <span className="text-sm font-semibold text-zinc-500">
          range {pred.predictedRange?.join("–")}
        </span>
        <span className={`ml-auto text-xs font-semibold ${activityTone}`}>{activityLabel}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Expected paper score ~{pred.accuracy.toFixed(0)}% (90% interval {ci}).
        {pred.pace !== null ? ` Pace ${pred.pace.toFixed(2)} marks/min.` : ""}
      </p>

      <div className="mt-4 flex items-end gap-2">
        {pred.projections.slice(0, 6).map((p) => (
          <div
            key={p.weeksFromNow}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${p.weeksFromNow}w: ${p.band}, ~${p.expected.toFixed(0)}% (${Math.round(p.lo)}–${Math.round(p.hi)})`}
          >
            <div className="flex h-16 w-full items-end rounded bg-zinc-100 dark:bg-zinc-800">
              <div
                className="w-full rounded bg-blue-500"
                style={{ height: `${Math.max(2, p.expected)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-500">{p.weeksFromNow}w</span>
            <span className="text-xs font-black">{p.band}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {probs.map((p) => (
          <span
            key={p.band}
            className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {p.band} <span className="font-normal text-zinc-500">{Math.round(p.p * 100)}%</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        EWMA of your whole attempt history; intervals widen further out on purpose. Boundaries are
        a heuristic — check the exam board&apos;s published grade before exam day.
      </p>
    </div>
  );
}