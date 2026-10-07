export interface DesignLaw {
  name: string;
  origin: string;
  principle: string;
  appliedAs: string;
}

export const DESIGN_LAWS: DesignLaw[] = [
  {
    name: "Hick's Law",
    origin: "Hick & Hyman",
    principle: "Decision time grows with the number of choices.",
    appliedAs:
      "Practice filters use chunked segmented controls (Easy / Medium / Hard, three modules) instead of long dropdowns, and each screen offers one primary action.",
  },
  {
    name: "Fitts's Law",
    origin: "Fitts",
    principle: "Time to hit a target depends on its size and distance.",
    appliedAs:
      "Primary buttons are at least 44px tall and full-width on mobile; related controls (answer field + Submit) sit adjacent to minimise pointer travel.",
  },
  {
    name: "Jakob's Law",
    origin: "Jakob Nielsen",
    principle: "Users spend most time on *other* sites, so they expect yours to work like the rest.",
    appliedAs:
      "Standard top navigation bar, card-based layouts, familiar search input with magnifier, and conventional progress indicators.",
  },
  {
    name: "Law of Proximity",
    origin: "Gestalt psychology",
    principle: "Related items appear grouped.",
    appliedAs:
      "Filters sit in one labelled band; answer box and submit button share a container; explanation steps are grouped inside a single panel.",
  },
  {
    name: "Miller's Law",
    origin: "George Miller (7±2)",
    principle: "Working memory holds about 7±2 chunks.",
    appliedAs:
      "Choices are capped at small groups (3 difficulties, 3 modules), chapters are paged into sections, and explanations show 3–5 steps at a time.",
  },
  {
    name: "Doherty Threshold",
    origin: "IBM / Doherty",
    principle: "Productivity soars when a system responds within ~400ms.",
    appliedAs:
      "Optimistic UI: the answer verdict renders instantly from the server check, questions are prefetched, and loading skeletons prevent layout stalls.",
  },
  {
    name: "Von Restorff Effect",
    origin: "Hedwig von Restorff",
    principle: "The item that stands out is remembered best.",
    appliedAs:
      "Wrong answers are isolated in a high-contrast panel with a red rail; correct answers use a green rail — so feedback is instantly distinguishable.",
  },
  {
    name: "Minimise Target Distance",
    origin: "Input efficiency heuristics",
    principle: "Keep frequent targets close to where the user is already pointing or typing.",
    appliedAs:
      "Submit sits immediately right of the answer input; Next appears where Submit was; Enter key submits without moving the pointer at all.",
  },
  {
    name: "Serial Position Effect",
    origin: "Ebbinghaus",
    principle: "First and last items in a series are recalled best.",
    appliedAs:
      "Each session opens with the score banner (primacy) and closes with a recap card (recency); the most exam-critical chapters are listed first and last in the syllabus view.",
  },
  {
    name: "Peak-End Rule",
    origin: "Kahneman",
    principle: "Experiences are judged by their most intense moment and the ending.",
    appliedAs:
      "Session summaries peak on what went well (strongest topic, pace against the 1-mark/min benchmark) and end with a clear next step — the mistakes-to-retest list — rather than dwelling on misses.",
  },
  {
    name: "Zeigarnik Effect",
    origin: "Bluma Zeigarnik",
    principle: "Incomplete tasks are remembered better than completed ones.",
    appliedAs:
      "A persistent progress bar shows remaining questions, and unfinished sessions are saved locally so users resume where they left off.",
  },
  {
    name: "Law of Prägnanz",
    origin: "Gestalt psychology",
    principle: "People perceive the simplest form possible.",
    appliedAs:
      "Layouts use plain grids, single-column reading order, and simple shapes — no decorative noise competing with the maths.",
  },
  {
    name: "Law of Similarity",
    origin: "Gestalt psychology",
    principle: "Similar items are perceived as a group.",
    appliedAs:
      "Difficulty chips share one visual style per level; module cards are colour-coded consistently (pure blue, stats green, mechanics amber) everywhere in the app.",
  },
  {
    name: "Uniform Connectedness",
    origin: "Gestalt psychology",
    principle: "Elements joined by a common boundary are seen as a unit.",
    appliedAs:
      "Answer input and submit button share one bordered container; nav links live in one connected bar; steps in explanations are chained by a connecting rail.",
  },
  {
    name: "Tesler's Law",
    origin: "Larry Tesler (conservation of complexity)",
    principle: "Every application has inherent complexity — someone must handle it.",
    appliedAs:
      "The user types one plain answer; LaTeX normalisation, equivalence testing and misconception detection happen on the server.",
  },
  {
    name: "Postel's Law",
    origin: "Jon Postel (robustness principle)",
    principle: "Be liberal in what you accept, conservative in what you send.",
    appliedAs:
      "Answer checking accepts LaTeX, plain text, fractions, 'or'/comma-separated sets, negligible whitespace and minor spelling variance before judging.",
  },
  {
    name: "Parkinson's Law",
    origin: "Cyril Northcote Parkinson",
    principle: "Work expands to fill the time available.",
    appliedAs:
      "Each question shows an estimated time of roughly one minute per mark (e.g. ~4 min for a 4 marks), encouraging focused, timeboxed practice sprints.",
  },
  {
    name: "Law of Closure",
    origin: "Gestalt psychology",
    principle: "People mentally complete unfinished shapes.",
    appliedAs:
      "The progress bar renders as an almost-closed track that 'closes' on completion, and answered questions become filled nodes.",
  },
  {
    name: "Law of Common Region",
    origin: "Gestalt psychology",
    principle: "Elements within the same boundary are grouped.",
    appliedAs:
      "Filters, questions and explanations each sit inside their own card boundary; chapter groups are boxed by module.",
  },
  {
    name: "Occam's Razor",
    origin: "William of Ockham",
    principle: "The simplest sufficient solution wins.",
    appliedAs:
      "Question generation uses lean parameterised templates with a programmatic solver — no heavy model calls — and the UI shows only what's needed for the task.",
  },
  {
    name: "Pareto Principle",
    origin: "Vilfredo Pareto (80/20)",
    principle: "Roughly 80% of effects come from 20% of causes.",
    appliedAs:
      "High-yield chapters (algebra, calculus, trig, probability) are badged 'high-yield' and surfaced first, matching their weight on the Edexcel papers.",
  },
  {
    name: "Aesthetic-Usability Effect",
    origin: "Kurosu & Kashimura",
    principle: "Attractive interfaces are perceived as easier to use.",
    appliedAs:
      "Consistent typography, restrained colour, smooth micro-transitions and a polished dark mode create trust in the tool's correctness.",
  },
];
