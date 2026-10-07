import { GeneratedQuestion } from "@/types/question";
import { StudentProfile } from "@/lib/profile/student-profile";

export interface Hint {
  depth: number;
  text: string;
}

/**
 * Graduated Socratic hints built from the worked steps: a nudge first,
 * the method next, the full solution last. Each reveal is one step up —
 * never the whole answer at once.
 */
export function buildHints(question: GeneratedQuestion): Hint[] {
  const steps = question.steps ?? [];
  const hints: Hint[] = [];

  const nudge = question.method?.split(/(?<=[.!?])\s/)[0];
  if (nudge) hints.push({ depth: 1, text: nudge });

  if (steps.length >= 1) {
    hints.push({ depth: 2, text: steps[0].working ? `${steps[0].explanation} ${steps[0].working}` : steps[0].explanation });
  }
  if (steps.length >= 2) {
    const second = steps[1].working ? `${steps[1].explanation} ${steps[1].working}` : steps[1].explanation;
    hints.push({ depth: 3, text: second });
  }
  if (steps.length >= 3 || !question.method) {
    const all = steps
      .map((s) => (s.working ? `${s.explanation} ${s.working}` : s.explanation))
      .join(" ");
    hints.push({ depth: 4, text: `Full route: ${all} Answer: ${question.answer}` });
  }

  return hints.slice(0, 4);
}

/**
 * Hints only unlock after a genuine attempt (sceptic: attempt-first), and
 * the ceiling fades down as a topic is mastered — independence is the goal,
 * not a permanent scaffold. Fragile topics keep the full ladder.
 */
export function maxHintDepth(profile: StudentProfile, chapter: string): number {
  const topic = profile.topics[chapter];
  if (!topic || topic.seen < 2) return 4;
  const accuracy = topic.correct / topic.seen;
  const hinted = topic.hintTotal / topic.seen;

  const mastered = topic.seen >= 4 && accuracy >= 0.8 && hinted < 0.5;
  if (mastered) return 1; // nudge only — solve it yourself
  const decent = topic.seen >= 3 && accuracy >= 0.6;
  return decent ? 2 : 4;
}

export type FeedbackDepth = "full" | "partial" | "terse";

/**
 * Adaptive fading of worked examples (cognitive science): beginners get the
 * full solution, intermediate learners get the method without the mechanics,
 * secure learners get one line — retrieval stays effortful where it should.
 */
export function autoFeedbackDepth(
  profile: StudentProfile,
  chapter: string
): FeedbackDepth {
  const topic = profile.topics[chapter];
  if (!topic || topic.seen < 2) return "full";
  const accuracy = topic.correct / topic.seen;
  if (accuracy >= 0.8 && topic.seen >= 4) return "terse";
  if (accuracy >= 0.6) return "partial";
  return "full";
}
