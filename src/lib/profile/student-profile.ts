import { useSyncExternalStore } from "react";
import { GeneratedQuestion, QuestionDifficulty } from "@/types/question";
import { scheduleAfter } from "@/lib/learning/spaced-repetition";

export type SessionMode =
  | "practice"
  | "mixed"
  | "timed"
  | "mistakes"
  | "foundation"
  | "tmua";

export interface AttemptRecord {
  id: string;
  title: string;
  chapter: string;
  specPoint?: string;
  difficulty: QuestionDifficulty;
  marks: number;
  correct: boolean;
  timeSeconds: number;
  hintsUsed: number;
  confidence?: number;
  misconception?: string;
  workingUsed: boolean;
  fragile: boolean;
  mode: SessionMode;
  answerFlags: string[];
  date: number;
}

export interface ErrorEntry {
  question: GeneratedQuestion;
  date: number;
  count: number;
  misconception?: string;
}

export interface TopicState {
  seen: number;
  correct: number;
  level: number;
  nextReview: number;
  lastSeen: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  hintTotal: number;
  secondsTotal: number;
  marksTotal: number;
}

export interface StudentProfile {
  version: 1;
  attempts: AttemptRecord[];
  errorLog: ErrorEntry[];
  topics: Record<string, TopicState>;
  misconceptions: Record<string, number>;
  fragileIds: string[];
  explainBacks: string[];
  settings: { feedbackStyle: "auto" | "terse" | "detailed" };
  examDate?: number;
}

const STORAGE_KEY = "edexcel-student-profile";
const MAX_ATTEMPTS = 600;
const MAX_ERRORS = 40;

export function emptyProfile(): StudentProfile {
  return {
    version: 1,
    attempts: [],
    errorLog: [],
    topics: {},
    misconceptions: {},
    fragileIds: [],
    explainBacks: [],
    settings: { feedbackStyle: "auto" },
  };
}

let cached: string | null | undefined;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("profile-update", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("profile-update", onChange);
  };
}

function readServer(): string | null {
  return null;
}

function readClient(): string | null {
  if (cached === undefined) {
    try {
      cached = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      cached = null;
    }
  }
  return cached;
}

function writeProfile(profile: StudentProfile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage full — drop oldest attempts and retry once
    const trimmed = { ...profile, attempts: profile.attempts.slice(-150) };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      /* unavailable — non-fatal */
    }
  }
  cached = JSON.stringify(profile);
  window.dispatchEvent(new Event("profile-update"));
}

export function getProfile(): StudentProfile {
  const raw = readClient();
  if (!raw) return emptyProfile();
  try {
    const parsed = JSON.parse(raw) as StudentProfile;
    if (parsed && parsed.version === 1) return parsed;
  } catch {
    // corrupt — start fresh
  }
  return emptyProfile();
}

/** useSyncExternalStore hooks — snapshot serialised to keep referential stability. */
export function useProfileSnapshot(): string | null {
  return useSyncExternalStore(subscribe, readClient, readServer);
}

export function parseProfile(raw: string | null): StudentProfile {
  if (!raw) return emptyProfile();
  try {
    const parsed = JSON.parse(raw) as StudentProfile;
    if (parsed && parsed.version === 1) return parsed;
  } catch {
    // fall through
  }
  return emptyProfile();
}

export interface AttemptInput {
  question: GeneratedQuestion;
  correct: boolean;
  timeSeconds: number;
  hintsUsed: number;
  confidence?: number;
  misconception?: string;
  workingUsed: boolean;
  workingMatchedSteps: number;
  mode: SessionMode;
  answerFlags: string[];
}

/**
 * Record one attempt: updates attempts, per-topic spaced-repetition state,
 * misconception counts, the re-testable error log, and fragile-understanding
 * detection (right answer via hints/rapid guess/low confidence = fragile).
 */
export function recordAttempt(input: AttemptInput): StudentProfile {
  const profile = getProfile();
  const now = Date.now();
  const { question, correct } = input;

  const fragile =
    correct &&
    (input.hintsUsed > 0 ||
      (input.timeSeconds < 8 && question.marks >= 3) ||
      (input.confidence !== undefined && input.confidence <= 2));

  const attempt: AttemptRecord = {
    id: question.id,
    title: question.title,
    chapter: question.chapter,
    specPoint: question.specPoint,
    difficulty: question.difficulty,
    marks: question.marks,
    correct,
    timeSeconds: input.timeSeconds,
    hintsUsed: input.hintsUsed,
    confidence: input.confidence,
    misconception: input.misconception,
    workingUsed: input.workingUsed,
    fragile,
    mode: input.mode,
    answerFlags: input.answerFlags,
    date: now,
  };

  const attempts = [...profile.attempts, attempt].slice(-MAX_ATTEMPTS);

  const topic = profile.topics[question.chapter] || {
    seen: 0,
    correct: 0,
    level: 0,
    nextReview: now,
    lastSeen: now,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    hintTotal: 0,
    secondsTotal: 0,
    marksTotal: 0,
  };

  const sched = scheduleAfter(topic.level, correct, now);
  const topics = {
    ...profile.topics,
    [question.chapter]: {
      seen: topic.seen + 1,
      correct: topic.correct + (correct ? 1 : 0),
      level: sched.level,
      nextReview: correct ? sched.nextReview : now,
      lastSeen: now,
      consecutiveCorrect: correct ? topic.consecutiveCorrect + 1 : 0,
      consecutiveWrong: correct ? 0 : topic.consecutiveWrong + 1,
      hintTotal: topic.hintTotal + input.hintsUsed,
      secondsTotal: topic.secondsTotal + input.timeSeconds,
      marksTotal: topic.marksTotal + question.marks,
    },
  };

  const misconceptions = { ...profile.misconceptions };
  if (!correct && input.misconception) {
    misconceptions[input.misconception] = (misconceptions[input.misconception] || 0) + 1;
  }

  let errorLog = [...profile.errorLog];
  const existingIdx = errorLog.findIndex((e) => e.question.id === question.id);
  if (!correct) {
    const entry: ErrorEntry = {
      question,
      date: now,
      count: (existingIdx >= 0 ? errorLog[existingIdx].count : 0) + 1,
      misconception: input.misconception,
    };
    if (existingIdx >= 0) errorLog.splice(existingIdx, 1);
    errorLog.unshift(entry);
    errorLog = errorLog.slice(0, MAX_ERRORS);
  } else if (existingIdx >= 0) {
    errorLog.splice(existingIdx, 1); // corrected — leave the log
  }

  const fragileIds = [...profile.fragileIds];
  const fi = fragileIds.indexOf(question.id);
  if (fragile && fi < 0) fragileIds.push(question.id);
  if (!fragile && correct && fi >= 0) fragileIds.splice(fi, 1);
  if (!correct && fi >= 0) fragileIds.splice(fi, 1);

  const next: StudentProfile = {
    ...profile,
    attempts,
    topics,
    misconceptions,
    errorLog,
    fragileIds,
  };
  writeProfile(next);
  return next;
}

export function updateSettings(patch: Partial<StudentProfile["settings"]>) {
  const profile = getProfile();
  writeProfile({ ...profile, settings: { ...profile.settings, ...patch } });
}

export function setExamDate(ts: number | undefined) {
  const profile = getProfile();
  writeProfile({ ...profile, examDate: ts });
}

export function addExplainBack(questionId: string) {
  const profile = getProfile();
  if (profile.explainBacks.includes(questionId)) return;
  writeProfile({ ...profile, explainBacks: [...profile.explainBacks, questionId] });
}

export function resetProfile() {
  writeProfile(emptyProfile());
}
