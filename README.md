# Edexcel A-Level Maths Revision Bot

A web revision tool for **Pearson Edexcel A-Level Mathematics (GCE, 9MA0)** with practice questions modelled on real past-paper questions, chapter search, a neural network that validates question solvability before questions are shown, and full worked explanations whenever an answer is wrong.

## Features

- **Exam-style question bank** — original questions written in the style of Edexcel past papers across Pure Mathematics, Statistics and Mechanics, plus 6 Large Data Set questions (lds-001…006) and 12 TMUA-style questions (tm-001…012). Every question carries its spec point, exam theme, command words, precision rules and an examiner-style mark scheme.
- **SymPy verification (anti-hallucination)** — every answer is re-derived independently by Python + SymPy before it ships: the hand-written bank (90 checks) and 18 generation templates sampled across 475 parameter sets (derivatives, integrals, equation solutions, inequalities, rounding to s.f., statistics, dice counts, vectors). The LLM writes the question; **code verifies the maths**. Run `npm run verify:generated` (regenerates + checks all 564, non-zero exit on failure). This pipeline already caught 4 real bugs (wrong definite-integral formula, inverted moments wording, rounding that broke equilibrium, degenerate questions).
- **Runtime SymPy second opinion** — if mathjs can't confirm an answer as correct, the checker asks an optional SymPy sidecar (`python/verify_service.py`, port 5399). Set `SYMPY_VERIFY_URL` and answers like `(x-3)(x-4)` vs `x^2 - 7x + 12` resolve symbolically; without it the checker stays conservative.
- **Neural network question validation** — a multilayer perceptron (10→16→8→1) is trained with backpropagation on question-quality features (has answer, has working, balanced notation, instruction verbs, length…). Generated questions are only served if the network clears a confidence threshold; candidates below threshold are regenerated (best-of-N gating).
- **Question generation** — parameterised templates with randomised values plus programmatic solvers, so every generated answer is verified correct by construction. Falls back automatically when the bank has no questions matching your filters.
- **Forgiving answer marking (Postel's Law)** — accepts LaTeX, plain text, fractions, equivalent expressions (symbolically simplified via mathjs), comma/`or`-separated answer sets, bare "12" for "x = 12", and ignores formatting noise. Sign errors are correctly rejected.
- **Explanations on wrong answers** — style-aware (full/partial/terse, auto-fading with accuracy), with step-by-step solution, likely misconception detected from the student's answer (e.g. missing `+c`, missing second trig solution, sign flip), spec-point tags and GCSE prerequisite notes.
- **Line-by-line working check** — students can paste (or photograph — OCR via tesseract.js) their working; every line gets `✓ match` / `○ final` / `?` verdicts against the reference route, plus M/A/B mark awarding.
- **Graded hint ladders** — wrong answers unlock hints first (attempt-gated); hint depth fades as a topic is mastered.
- **Chapter search** — search the full specification by keyword, spec-point title or topic with relevance ranking, or browse grouped modules with "High yield" badges on the chapters that carry the most marks (Pareto).
- **Practice sessions** — five modes (`practice`, `mixed`, `timed`, `mistakes`, `foundation`, plus `tmua`), timed conditions (gentle/realistic/strict with a 1-mark-per-minute countdown), error-log re-tests, and resume of unfinished sessions from localStorage.
- **Progress dashboard** (`/progress`) — gap analysis in paper-mark terms, a **grade prediction model** (EWMA accuracy + Wilson 90% interval, projection bars out to 6 months, per-grade probabilities, declining/flat/improving trend), an honest rehearsal grade estimate fallback, spaced-repetition due dates, pace vs the 1-mark/min benchmark, confidence calibration, priorities (exam weight × weakness × due-ness), "needs a human" flags, an exam-date plan working backwards, and a copy/print parent-teacher report.
- **Session log + database** (`/progress`) — every completed (or abandoned) practice session is persisted to a browser IndexedDB store: date, mode, score, marks, pace, slow-answer count and strongest topic. The log renders newest-first with weekly counts and feeds the pace/trend readouts in the prediction model. No account needed — it lives in your browser like the rest of your profile.
- **TMUA hub** (`/tmua`) — evidence for the two papers' formats, a Paper 2 reasoning toolkit (counterexamples, hidden assumptions, necessary vs sufficient, consistency, data-in-context), proof techniques, and a seven-bridge A-level→Further Maths guide.
- **Deep links** — `/practice?chapter=Differentiation` starts a single-chapter session; `/practice?mode=tmua|foundation|mistakes` starts mode-specific sets.

## UX laws applied

The interface deliberately implements 22 evidence-based laws (Hick's, Fitts's, Jakob's, Miller's, Doherty, Von Restorff, serial position, peak-end, Zeigarnik, Prägnanz, proximity, similarity, uniform connectedness, Tesler's, Postel's, Parkinson's, closure, common region, Occam's Razor, Pareto, aesthetic-usability, minimise target distance) — each one is documented in-app on the home page under "Built on evidence-based UX laws".

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- KaTeX for LaTeX rendering
- mathjs for symbolic/numeric answer equivalence, optional SymPy sidecar (`python/verify_service.py`) for a deeper second opinion
- tesseract.js for handwriting/photo OCR of working — loaded lazily from the jsDelivr CDN at runtime (keeps the project ~50&nbsp;MB smaller; degrades to "type it instead" offline)
- Browser IndexedDB for the session log database (`src/lib/db/session-db.ts`)
- Custom TypeScript neural network (seeded, trained at first use — no native deps, Vercel-safe)

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/questions` | GET | Bank + generated questions; filters: `difficulty`, `questionType`, `chapter`, `count` |
| `/api/check` | POST | `{ userAnswer, correctAnswer, working?, referenceSteps? }` → tolerant equivalence check, per-line working verdicts, optional SymPy tiebreaker |
| `/api/explain` | POST | `{ question, userAnswer, correct, style?, prereqGaps? }` → worked explanation, misconception, spec tag & prerequisite notes |
| `/api/search` | GET | `?q=` relevance search (topics + spec-point titles); `?grouped=1` module-grouped syllabus |

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

### Mathematical verification

```bash
pip install -r python/requirements.txt   # once (installs SymPy)
npm run verify:generated                 # dump fresh template samples + verify everything
npm run verify:math                      # verify existing spec files (bank + generated)
```

`python/verify_math.py` checks the question bank (`python/verify_specs.json`) and freshly sampled generator templates (`python/generated_specs.json`, produced by `scripts/dump-generated.ts`) using independent symbolic computation: `equivalent`, `solve` (with `realOnly`), `solve_domain` (e.g. trig over 0–360°), `inequality`, `derivative`, `integral_indefinite`, `integral_definite`, `numeric` (s.f./tolerance), `expand_coeffs`, `stationary`, `stats_mean_sd`, `stats_iqr`, `dice_sum`, `vector_on_line`. Any failure exits non-zero, so wire it into CI so a hallucinated answer can never ship.

## Deploy to Vercel

Push to GitHub and import the repo in Vercel (or `npx vercel`). `vercel.json` is included; no environment variables or native build steps are required.

## Project structure

```
src/
  app/                  # pages: /, /practice, /search, /progress, /tmua + API routes
  components/           # nav, KaTeX renderer, UI primitives, practice panels (hints/confidence/marks/OCR)
  data/
    chapters/           # Edexcel specification chapters/topics + spec-point map
    questions/          # exam-style bank (incl. 6 LDS questions) + TMUA bank
  lib/
    nn/                 # neural network + question generator
    exam/               # command words, precision flags, mark schemes
    learning/           # spaced repetition, hint ladders, topic diagnosis/gap analysis, grade prediction model
    profile/            # cross-session student profile (attempts, error log, settings)
    db/                 # IndexedDB session-log database (client)
    question-engine/    # solvability checks
    explanations/       # misconception detection & explanation engine
    solvers/            # tolerant answer checker + SymPy sidecar client
    search/             # relevance search
    design/             # UX law registry rendered on the home page
  types/                # shared TypeScript models
python/
  verify_math.py        # SymPy harness: re-derives every answer independently
  verify_service.py     # runtime SymPy equivalence sidecar (port 5399)
  verify_specs.json     # bank verification specs (90 checks: eb, lds, tmua)
  generated_specs.json  # template samples (dumped by scripts/dump-generated.ts)
  requirements.txt
scripts/
  dump-generated.ts     # samples all 18 templates into generated_specs.json
```

### Runtime SymPy sidecar (optional)

```bash
python python/verify_service.py   # listens on http://localhost:5399/verify
# then point the app at it:
SYMPY_VERIFY_URL=http://localhost:5399/verify npm run dev
```

The app keeps working without it — mathjs does the first pass and the sidecar only upgrades borderline answers to `checker: "sympy"`.

---

Independent study tool. Not affiliated with or endorsed by Pearson. Questions are original, written in the style of published Edexcel past papers.
