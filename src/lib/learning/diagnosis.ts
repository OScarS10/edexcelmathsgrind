import { StudentProfile, AttemptRecord } from "@/lib/profile/student-profile";
import { specForChapter } from "@/data/chapters/spec-map";
import { isDue, daysUntil } from "@/lib/learning/spaced-repetition";

export type TopicStatus = "unseen" | "developing" | "secure" | "at-risk" | "gap";

export interface TopicDiagnosis {
  chapter: string;
  seen: number;
  accuracy: number;
  status: TopicStatus;
  needsHuman: boolean;
  prereqGaps: string[];
  due: boolean;
  nextReviewInDays: number | null;
  secPerMark: number | null;
  slow: boolean;
  marksWeight: number;
  specCode: string;
  consecutiveWrong: number;
}

const BENCHMARK_SEC_PER_MARK = 75; // ~1 mark/min with thinking time
const SLOW_FACTOR = 1.8;

export function diagnoseTopics(profile: StudentProfile): TopicDiagnosis[] {
  const chapters = new Set<string>([
    ...Object.keys(profile.topics),
    ...profile.attempts.map((a) => a.chapter),
  ]);

  return [...chapters].map((chapter) => {
    const topic = profile.topics[chapter];
    const spec = specForChapter(chapter);
    const seen = topic?.seen ?? 0;
    const accuracy = seen > 0 ? (topic.correct / seen) : 0;
    const secPerMark =
      topic && topic.marksTotal > 0 ? topic.secondsTotal / topic.marksTotal : null;

    let status: TopicStatus = "unseen";
    if (seen > 0) {
      if (accuracy < 0.5 && seen >= 4) status = "gap";
      else if (accuracy < 0.65 || (topic.consecutiveWrong >= 2 && seen >= 3)) status = "at-risk";
      else if (accuracy >= 0.8 && seen >= 3) status = "secure";
      else status = "developing";
    }

    const needsHuman =
      topic?.consecutiveWrong >= 3 || (status === "gap" && seen >= 6);

    return {
      chapter,
      seen,
      accuracy,
      status,
      needsHuman,
      prereqGaps: status === "gap" || status === "at-risk" ? spec.prerequisites : [],
      due: topic ? isDue(topic.nextReview) : false,
      nextReviewInDays: topic ? daysUntil(topic.nextReview) : null,
      secPerMark,
      slow: secPerMark !== null && secPerMark > BENCHMARK_SEC_PER_MARK * SLOW_FACTOR,
      marksWeight: spec.marksWeight,
      specCode: spec.specPoints[0].code,
      consecutiveWrong: topic?.consecutiveWrong ?? 0,
    };
  }).sort((a, b) => b.marksWeight - a.marksWeight);
}

export interface GapReport {
  headline: string;
  weakest: Array<{ chapter: string; accuracy: number; seen: number }>;
  estimatedCostPercent: number;
}

/**
 * Gap analysis for the C/B→A* student: what the weak topics are actually
 * costing on a full paper, expressed as an approximate mark-share loss.
 */
export function gapAnalysis(diags: TopicDiagnosis[]): GapReport {
  const attempted = diags.filter((d) => d.seen >= 3);
  const weak = attempted
    .filter((d) => d.accuracy < 0.75)
    .sort((a, b) => (b.marksWeight * (1 - b.accuracy)) - (a.marksWeight * (1 - a.accuracy)));

  const cost = weak.reduce((s, d) => s + d.marksWeight * (1 - d.accuracy), 0);
  const weakest = weak.slice(0, 4).map((d) => ({
    chapter: d.chapter,
    accuracy: Math.round(d.accuracy * 100),
    seen: d.seen,
  }));

  const pct = Math.round(cost * 100);
  const headline =
    weak.length === 0
      ? "No significant gaps in attempted topics — keep mixing it up."
      : `${weakest[0].chapter} is the biggest leak: roughly ${pct}% of paper marks at risk right now.`;

  return { headline, weakest, estimatedCostPercent: pct };
}

export interface GradeEstimate {
  band: string;
  range: string;
  confidence: "low" | "medium" | "high";
  accuracy: number;
  basis: string;
}

/**
 * Honest prediction: recent practice accuracy mapped to a grade band with an
 * explicit range. Never claims more certainty than the evidence supports.
 */
export function estimateGrade(profile: StudentProfile): GradeEstimate | null {
  const recent = profile.attempts.slice(-80);
  if (recent.length < 10) return null;

  const accuracy =
    recent.reduce((s, a) => s + (a.correct ? 1 : 0), 0) / recent.length;

  const bands = [
    { max: 0.5, band: "E" },
    { max: 0.6, band: "D" },
    { max: 0.7, band: "C" },
    { max: 0.8, band: "B" },
    { max: 0.9, band: "A" },
    { max: 1.01, band: "A*" },
  ];
  const idx = bands.findIndex((b) => accuracy < b.max);
  const band = bands[Math.max(0, idx)].band;

  const order = ["E", "D", "C", "B", "A", "A*"];
  const i = order.indexOf(band);
  const spread = recent.length < 30 ? 2 : 1;
  const lo = order[Math.max(0, i - spread)];
  const hi = order[Math.min(order.length - 1, i + spread)];

  return {
    band,
    range: lo === hi ? band : `${lo}–${hi}`,
    confidence: recent.length >= 50 ? "medium" : "low",
    accuracy: Math.round(accuracy * 100),
    basis: `Based on your last ${recent.length} questions (${Math.round(accuracy * 100)}% accuracy). Grade boundaries vary by paper — treat this as a rehearsal estimate, not a prediction.`,
  };
}

export interface CalibrationReport {
  overconfident: boolean;
  underconfident: boolean;
  confidentAccuracy: number | null;
  unsureAccuracy: number | null;
  message: string;
}

/** Confidence-vs-outcome calibration (cognitive science). */
export function calibration(profile: StudentProfile): CalibrationReport | null {
  const withConfidence = profile.attempts.filter((a) => a.confidence !== undefined);
  const confident = withConfidence.filter((a) => a.confidence! >= 3);
  const unsure = withConfidence.filter((a) => a.confidence! <= 2);
  if (confident.length < 5 || unsure.length < 3) return null;

  const acc = (list: AttemptRecord[]) =>
    list.reduce((s, a) => s + (a.correct ? 1 : 0), 0) / list.length;

  const confidentAccuracy = acc(confident);
  const unsureAccuracy = acc(unsure);
  const overconfident = confidentAccuracy < 0.7 && confident.length >= 5;
  const underconfident = confidentAccuracy >= 0.9 && unsureAccuracy >= 0.75;

  let message: string;
  if (overconfident) {
    message = `When you feel confident you're getting ${Math.round(confidentAccuracy * 100)}% right — slow down on the questions that feel easy; that's where marks are leaking.`;
  } else if (underconfident) {
    message = `You're rating yourself down but scoring ${Math.round(confidentAccuracy * 100)}% when confident — you know more than you think. Trust your first working.`;
  } else {
    message = `Calibration looks healthy: ${Math.round(confidentAccuracy * 100)}% when confident vs ${Math.round(unsureAccuracy * 100)}% when unsure.`;
  }

  return { overconfident, underconfident, confidentAccuracy, unsureAccuracy, message };
}

export interface Priority {
  chapter: string;
  score: number;
  reason: string;
}

/** Marks-per-effort priorities: exam weight × weakness × due-ness. */
export function priorities(profile: StudentProfile, diags: TopicDiagnosis[]): Priority[] {
  return diags
    .filter((d) => d.seen >= 1)
    .map((d) => {
      const weakness = 1 - d.accuracy;
      const due = d.due ? 1 : 0.4;
      const score = Math.round(d.marksWeight * weakness * due * 100);
      const reasons: string[] = [];
      if (d.accuracy < 0.75) reasons.push("weak accuracy");
      if (d.marksWeight >= 0.1) reasons.push("high exam weight");
      if (d.due) reasons.push("due for review");
      if (d.slow) reasons.push("slow pace");
      return { chapter: d.chapter, score, reason: reasons.join(", ") || "maintain" };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
}

export interface HumanFlag {
  message: string;
  chapter: string;
}

/** Flags a teacher should see — auto-detected, never sugar-coated. */
export function needsHumanFlags(profile: StudentProfile, diags: TopicDiagnosis[]): HumanFlag[] {
  const flags: HumanFlag[] = [];
  for (const d of diags) {
    if (d.consecutiveWrong >= 3) {
      flags.push({
        chapter: d.chapter,
        message: `${d.consecutiveWrong} wrong in a row in ${d.chapter} — worth 10 minutes with a teacher or parent.`,
      });
    } else if (d.status === "gap" && d.seen >= 6) {
      flags.push({
        chapter: d.chapter,
        message: `${Math.round(d.accuracy * 100)}% across ${d.seen} attempts in ${d.chapter} — self-study isn't shifting this one; ask for help.`,
      });
    }
  }
  const chronic = profile.errorLog.find((e) => e.count >= 3);
  if (chronic) {
    flags.push({
      chapter: chronic.question.chapter,
      message: `"${chronic.question.title}" has been missed ${chronic.count} times — same question type keeps failing.`,
    });
  }
  return flags.slice(0, 5);
}

export interface ExamPlan {
  weeksLeft: number;
  sessionsPerWeek: number;
  minutesPerSession: number;
  focus: Array<{ chapter: string; sessions: number }>;
  microSessions: string[];
}

/** Plan working backwards from the exam date (time-poor student). */
export function examPlan(profile: StudentProfile, diags: TopicDiagnosis[]): ExamPlan | null {
  if (!profile.examDate) return null;
  const weeksLeft = Math.max(1, Math.floor((profile.examDate - Date.now()) / (7 * 24 * 60 * 60 * 1000)));
  const p = priorities(profile, diags);
  const focus = p.slice(0, 3).map((x) => ({
    chapter: x.chapter,
    sessions: Math.max(1, Math.round(weeksLeft / 3) % 4 || 1),
  }));
  return {
    weeksLeft,
    sessionsPerWeek: weeksLeft <= 4 ? 4 : weeksLeft <= 8 ? 3 : 2,
    minutesPerSession: weeksLeft <= 4 ? 40 : 25,
    focus,
    microSessions: [
      "10-minute sets fit between lessons — 4 questions beats 0 questions.",
      "Do one mistakes re-test before bed; sleep consolidates it.",
      "On heavy days, one micro-session still keeps the spaced-repetition schedule alive.",
    ],
  };
}

export interface SummaryStats {
  totalAttempts: number;
  recentAccuracy: number | null;
  topicsAttempted: number;
  topicsSecure: number;
  topicsGap: number;
  masteredTopics: number;
  workingDays: number;
}

export function summaryStats(profile: StudentProfile, diags: TopicDiagnosis[]): SummaryStats {
  const last30 = profile.attempts.filter((a) => a.date > Date.now() - 30 * 24 * 60 * 60 * 1000);
  const days = new Set(profile.attempts.map((a) => new Date(a.date).toDateString())).size;
  return {
    totalAttempts: profile.attempts.length,
    recentAccuracy: last30.length > 0
      ? Math.round((last30.filter((a) => a.correct).length / last30.length) * 100)
      : null,
    topicsAttempted: diags.filter((d) => d.seen > 0).length,
    topicsSecure: diags.filter((d) => d.status === "secure").length,
    topicsGap: diags.filter((d) => d.status === "gap" || d.status === "at-risk").length,
    masteredTopics: diags.filter((d) => d.status === "secure" && d.seen >= 5).length,
    workingDays: days,
  };
}

/** Topics whose spaced-repetition review is due right now. */
export function dueTopics(profile: StudentProfile): Array<{ chapter: string; accuracy: number }> {
  return Object.entries(profile.topics)
    .filter(([, t]) => isDue(t.nextReview) && t.seen >= 2 && t.correct / t.seen < 0.9)
    .map(([chapter, t]) => ({ chapter, accuracy: Math.round((t.correct / t.seen) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function recurringMisconceptions(profile: StudentProfile, limit = 5): Array<{ tag: string; count: number }> {
  return Object.entries(profile.misconceptions)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
