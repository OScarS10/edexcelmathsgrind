/**
 * Optional runtime SymPy verification.
 *
 * When SYMPY_VERIFY_URL points at a SymPy service (python/verify_service.py,
 * run anywhere — locally, a container, or a small sidecar deploy), wrong
 * verdicts from the fast mathjs checker get a second opinion from SymPy
 * before the student is told they're wrong. With no URL configured (or on
 * timeout/error) we simply stay with mathjs — code always verifies; the
 * model never does.
 */

const TIMEOUT_MS = 3000;

export function sympyConfigured(): boolean {
  return !!process.env.SYMPY_VERIFY_URL;
}

export async function sympyEquivalent(
  normalisedUser: string,
  normalisedAnswer: string
): Promise<boolean | null> {
  const url = process.env.SYMPY_VERIFY_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAnswer: normalisedUser,
        correctAnswer: normalisedAnswer,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { equivalent?: unknown };
    return typeof data.equivalent === "boolean" ? data.equivalent : null;
  } catch {
    return null;
  }
}
