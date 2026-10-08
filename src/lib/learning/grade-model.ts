import { AttemptRecord, StudentProfile } from "@/lib/profile/student-profile";
import { SessionRecord } from "@/lib/db/session-db";

/**
 * Grade prediction & modelling.
 *
 * Not a party trick: a deterministic, defensible model over the attempt
 * history. Recent answers carry more weight (exponential weighted moving
 * average), uncertainty is stated as a Wilson interval (so a handful of
 * answers produces an honest, wide range), improvement is extrapolated
 * with a decaying learning-curve (asymptote, not a straight line), and the
 * horizon targets the stored exam date. It deliberately refuses to claim
 * precision with fewer than 12 attempts across 2+ days.
 */

export type GradeBand = "A*" | "A" | "B" | "C" | "D" | "E" | "U";

export const GRADE_BANDS: GradeBand[] = ["U", "E", "D", "C", "B", "A", "A*"];

/**
 * Percentage-of-marks grade bands, calibrated to real Edexcel 9MA0 grade
 * boundaries rather than round numbers. Boundaries move every session —
 * 2019–2024 sittings have ranged roughly A* 70–77, A 62–67, B 52–58,
 * C 42–48, D 33–39, E 25–31 — so this table is a midpoint, not a promise.
 */
export const GRADE_BOUNDARIES: Record<GradeBand, number> = {
  U: 0,
  E: 26,
  D: 34,
  C: 43,
  B: 53,
  A: 64,
  "A*": 75,
};

export const BOUNDARY_SOURCE =
  "midpoints of recent Edexcel 9MA0 boundaries (2019–2024 sittings: A* 70–77%, A 62–67%, B 52–58%, C 42–48%, D 33–39%, E 25–31%)";

export const PAPER_GRADE_DISCLAIMER =
  "Boundaries move every session and a short practice set is not a full paper — this is a rough conversion of your marks percentage, not an exam grade.";

const BAND_FLOORS: Record<GradeBand, number> = GRADE_BOUNDARIES;

export interface WilsonInterval {
  lo: number;
  hi: number;
}

export interface ProjectionPoint {
  date: number;
  weeksFromNow: number;
  expected: number;
  lo: number;
  hi: number;
  band: GradeBand;
}

export interface GradePrediction {
  usable: boolean;
  reason: string | null;
  sample: number;
  spanDays: number;
  accuracy: number;
  interval: WilsonInterval | null;
  predictedBand: GradeBand | null;
  predictedRange: [GradeBand, GradeBand] | null;
  improvementPerWeek: number;
  activity: "declining" | "flat" | "improving";
  projections: ProjectionPoint[];
  probabilities: Array<{ band: GradeBand; p: number }>;
  pace: number | null;
}

const Z = 1.645; // ~90% two-sided

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function bandFor(pct: number): GradeBand {
  for (const b of [...GRADE_BANDS].reverse()) {
    if (pct >= BAND_FLOORS[b]) return b;
  }
  return "U";
}

export interface PaperGrade {
  /** Marks as a percentage of the set/paper. */
  pct: number;
  band: GradeBand;
  /** Next band boundary below the current one, for "just short of…" messaging. */
  boundaryNote: string;
}

/**
 * Convert a marks percentage (from a practice set or a paper) into a band
 * using recent grade boundaries. Always pair the result with
 * PAPER_GRADE_DISCLAIMER in the UI.
 */
export function gradeForPaperPct(pct: number): PaperGrade {
  const rounded = Math.round(clamp(pct, 0, 100));
  return { pct: rounded, band: bandFor(rounded), boundaryNote: BOUNDARY_SOURCE };
}

/** Wilson score interval for a binary proportion (k correct of n). */
export function wilsonInterval(k: number, n: number, z = Z): WilsonInterval {
  const denom = 1 + (z * z) / n;
  const center = (k + (z * z) / 2) / n / denom;
  const margin = (z * Math.sqrt((k * (n - k)) / n + (z * z) / 4)) / n / denom;
  return {
    lo: clamp((center - margin) * 100, 0, 100),
    hi: clamp((center + margin) * 100, 0, 100),
  };
}

/** Exponential weighted moving average of accuracy over chronological attempts. */
export function ewmaAccuracy(attempts: readonly AttemptRecord[], alpha = 0.3): number {
  let ema = 0.5;
  for (const a of attempts) {
    ema += alpha * ((a.correct ? 1 : 0) - ema);
  }
  return ema;
}

export function averagePace(profile: StudentProfile, sessions: readonly SessionRecord[]): number | null {
  const fromProfile =
    profile.topics && Object.keys(profile.topics).length > 0
      ? Object.values(profile.topics).reduce(
          (s, t) => (t.marksTotal > 0 ? s + t.secondsTotal / t.marksTotal : s),
          0
        ) / Math.max(1, Object.keys(profile.topics).length)
      : null;
  if (fromProfile !== null && fromProfile > 0) return 60 / fromProfile;

  const recent = sessions
    .filter((s) => !s.abandoned && s.pace > 0 && s.attempts >= 3)
    .slice(0, 8);
  if (recent.length === 0) return null;
  return recent.reduce((s, r) => s + r.pace, 0) / recent.length;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Full prediction. `sessions` are optional and only influence the reported
 * pace readout, never the accuracy projection — speed is displayed, not
 * smuggled into the grade as if it were accuracy.
 */
export function predictGrade(
  profile: StudentProfile,
  sessions: readonly SessionRecord[],
  now: number
): GradePrediction {
  const attempts = [...profile.attempts].sort((a, b) => a.date - b.date);
  const n = attempts.length;

  const spanDays =
    n >= 2 ? Math.max(0, (attempts[n - 1].date - attempts[0].date) / DAY) : 0;
  const usable = n >= 12 && spanDays >= 1;

  // Recency-weighted accuracy, blended with the whole-history rate so a short
  // run of wrong answers doesn't crater the headline number. EWMA on its own
  // is too tail-sensitive to predict from.
  const ewma = ewmaAccuracy(attempts, 0.25);
  const overallRate = attempts.reduce((s, a) => s + (a.correct ? 1 : 0), 0) / attempts.length;
  const accuracy = (ewma * 0.7 + overallRate * 0.3) * 100;

  const k = Math.round((accuracy / 100) * Math.min(n, 150));
  const interval = usable ? wilsonInterval(clamp(k, 0, Math.min(n, 150)), Math.min(n, 150)) : null;

  const pace = averagePace(profile, sessions);

  if (!usable) {
    const reason =
      n === 0
        ? "Answer some questions first — the model needs a history to predict from."
        : n < 12
          ? `The model needs at least a dozen answered questions; you have ${n}. Keep practising — the plain rehearsal estimate above still applies.`
          : "Spread practice across at least two days before we model a trajectory.";
    return {
      usable: false,
      reason,
      sample: n,
      spanDays,
      accuracy,
      interval: null,
      predictedBand: null,
      predictedRange: null,
      improvementPerWeek: 0,
      activity: "flat",
      projections: [],
      probabilities: [],
      pace,
    };
  }

  const mid = (attempts[0].date + attempts[n - 1].date) / 2;
  const first = attempts.filter((a) => a.date <= mid);
  const second = attempts.filter((a) => a.date > mid);
  const acc = (list: AttemptRecord[]) =>
    list.length > 0 ? list.reduce((s, a) => s + (a.correct ? 1 : 0), 0) / list.length : 0.5;
  const firstAcc = acc(first);
  const secondAcc = acc(second);

  // Shrink the observed trend toward zero by one standard error of the
  // difference — sampling noise must not read as a dramatic decline (or rise).
  const delta = secondAcc - firstAcc;
  const se = Math.sqrt(
    (firstAcc * (1 - firstAcc)) / Math.max(1, first.length) +
      (secondAcc * (1 - secondAcc)) / Math.max(1, second.length)
  );
  const shrunkDelta = Math.sign(delta) * Math.max(0, Math.abs(delta) - se);
  const rawPerWeek = (shrunkDelta / Math.max(1, spanDays / 7)) * 100;
  const improvementPerWeek = clamp(rawPerWeek, -1.2, 1.2);

  const activity: GradePrediction["activity"] =
    improvementPerWeek > 0.15 ? "improving" : improvementPerWeek < -0.15 ? "declining" : "flat";

  // Decaying learning curve: gains accumulate toward an asymptote rather than
  // rising forever. All quantities below are in percent points (0–100).
  const halfLifeWeeks = 6;
  const gain = clamp(improvementPerWeek * halfLifeWeeks, -20, 20);
  const ceiling = clamp(accuracy + gain, 5, 92);
  const floor = Math.min(5, ceiling);

  const weeks = [1, 2, 4, 8, 12, 16, 20, 24];
  const projections: ProjectionPoint[] = weeks.map((w) => {
    const t = 1 - Math.exp(-w / halfLifeWeeks);
    const expected = clamp(accuracy + (ceiling - accuracy) * t, floor, 96);
    const halfWidth = (interval?.hi ?? 0) - (interval?.lo ?? 0);
    const projectedHalfWidth = (halfWidth / 2) * Math.sqrt(1 + (w / 26) * 2.5);
    return {
      date: now + w * 7 * DAY,
      weeksFromNow: w,
      expected: Math.round(expected * 10) / 10,
      lo: clamp(expected - projectedHalfWidth, 0, 100),
      hi: clamp(expected + projectedHalfWidth, 0, 100),
      band: bandFor(expected),
    };
  });

  const targetWeeks = profile.examDate
    ? clamp(Math.round((profile.examDate - now) / (7 * DAY)), 2, 40)
    : 13;
  const target = projections.find((p) => p.weeksFromNow === targetWeeks) ?? projections[2] ?? projections[0];

  const predictedBand = target.band;

  const sd = Math.max(2, (target.hi - target.lo) / (2 * Z));
  const cdf = (x: number) => {
    const z = (x - target.expected) / sd;
    return 0.5 * (1 + erf(z / Math.SQRT2));
  };
  const probabilities = GRADE_BANDS.map((band) => {
    const loFloor = band === "U" ? -Infinity : BAND_FLOORS[band];
    const hiFloor =
      band === "A*"
        ? Infinity
        : BAND_FLOORS[GRADE_BANDS[GRADE_BANDS.indexOf(band) + 1]];
    const p = Math.max(0, cdf(hiFloor) - cdf(loFloor));
    return { band, p };
  });
  const sum = probabilities.reduce((s, p) => s + p.p, 0) || 1;
  const normalized = probabilities.map((p) => ({ band: p.band, p: p.p / sum }));

  const rangeWidth = Math.max(1, Math.round((target.hi - target.lo) / 10));
  const order = GRADE_BANDS;
  const center = order.indexOf(predictedBand);
  const loBand = order[Math.max(0, center - rangeWidth)];
  const hiBand = order[Math.min(order.length - 1, center + rangeWidth)];

  return {
    usable: true,
    reason: null,
    sample: n,
    spanDays,
    accuracy,
    interval,
    predictedBand,
    predictedRange: [loBand, hiBand],
    improvementPerWeek,
    activity,
    projections,
    probabilities: normalized,
    pace,
  };
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Human-readable projection dates, used by the /progress report. */
export function formatPrediction(pred: GradePrediction): string {
  if (!pred.usable || !pred.predictedBand) return "No model yet — keep practising.";
  const range = pred.predictedRange
    ? `${pred.predictedRange[0]}–${pred.predictedRange[1]}`
    : pred.predictedBand;
  const trend =
    pred.activity === "improving"
      ? `and improving ~${pred.improvementPerWeek.toFixed(1)} pts/week`
      : pred.activity === "declining"
        ? `and slipping ~${Math.abs(pred.improvementPerWeek).toFixed(1)} pts/week`
        : "steady";
  const pace = pred.pace ? ` · pace ${pred.pace.toFixed(2)} marks/min` : "";
  return `Model: ${pred.predictedBand} (range ${range}) at ~${pred.sample} attempts, ${trend}${pace}.`;
}