/**
 * Simplified SM-2 style scheduling. Level grows on success, resets on failure,
 * and a topic becomes "due" when nextReview passes — this is what powers the
 * retrieval-practice / spaced-repetition / interleaving loop.
 */

const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export interface ScheduleState {
  level: number;
  nextReview: number;
}

export function scheduleAfter(level: number, correct: boolean, now = Date.now()): ScheduleState {
  if (!correct) {
    return { level: 0, nextReview: now };
  }
  const next = Math.min(level + 1, INTERVALS_DAYS.length - 1);
  const days = INTERVALS_DAYS[next];
  return { level: next, nextReview: now + days * 24 * 60 * 60 * 1000 };
}

export function isDue(nextReview: number, now = Date.now()): boolean {
  return nextReview <= now;
}

export function daysUntil(nextReview: number, now = Date.now()): number {
  return Math.ceil((nextReview - now) / (24 * 60 * 60 * 1000));
}

/**
 * Interleaved selection: weight topics by weakness × due-ness so review sets
 * mix subjects instead of blocking them (blocked practice feels better and
 * performs worse).
 */
export function reviewPriority(
  stats: { seen: number; correct: number; nextReview: number },
  now = Date.now()
): number {
  if (stats.seen === 0) return 0;
  const accuracy = stats.correct / stats.seen;
  const weakness = 1 - accuracy;
  const dueBoost = isDue(stats.nextReview, now) ? 1 : 0.3;
  const recencyBoost = stats.seen < 3 ? 0.5 : 0;
  return weakness * dueBoost + recencyBoost;
}
