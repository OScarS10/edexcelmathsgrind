import { GeneratedQuestion } from "@/types/question";
import { SessionMode } from "@/lib/profile/student-profile";

export type Conditions = "gentle" | "realistic" | "strict";

export interface QuestionResult {
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

export interface SessionState {
  questions: GeneratedQuestion[];
  index: number;
  score: number;
  mode: SessionMode;
  conditions: Conditions;
  questionStart: number;
  startedAt?: number;
  results: QuestionResult[];
}