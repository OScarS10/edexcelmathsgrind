import { ExamTheme } from "@/types/question";

export interface SpecPoint {
  code: string;
  title: string;
}

export interface ChapterSpec {
  specPoints: SpecPoint[];
  theme: ExamTheme;
  /** Approximate share of the 9MA0 paper — drives marks-per-effort priorities. */
  marksWeight: number;
  /** GCSE-level skills this chapter assumes — used to diagnose the real gap. */
  prerequisites: string[];
  /** Part of the Edexcel Large Data Set context. */
  lds?: boolean;
}

const FLUENCY: ExamTheme = "Understanding and fluency";
const REASONING: ExamTheme = "Thinking and reasoning";
const PROBLEM: ExamTheme = "Problem solving";

export const CHAPTER_SPEC: Record<string, ChapterSpec> = {
  Proof: {
    specPoints: [
      { code: "PM1.1", title: "Constructing proofs by deduction" },
      { code: "PM1.2", title: "Proof by contradiction (e.g. √2 is irrational)" },
    ],
    theme: PROBLEM,
    marksWeight: 0.03,
    prerequisites: ["GCSE algebraic manipulation", "GCSE mathematical notation & language"],
  },
  "Algebra and functions": {
    specPoints: [
      { code: "PM2.1", title: "Algebraic manipulation, surds, partial fractions" },
      { code: "PM2.2", title: "Quadratic functions & the discriminant" },
      { code: "PM2.3", title: "Simultaneous equations & inequalities" },
      { code: "PM2.4", title: "Graphs, transformations, composite & inverse functions" },
    ],
    theme: FLUENCY,
    marksWeight: 0.15,
    prerequisites: ["GCSE brackets & factorising", "GCSE indices laws", "GCSE solving linear equations"],
  },
  "Coordinate geometry": {
    specPoints: [
      { code: "PM3.1", title: "Straight lines: gradient, perpendicular lines" },
      { code: "PM3.2", title: "Circles: equation, intersection with lines" },
    ],
    theme: FLUENCY,
    marksWeight: 0.06,
    prerequisites: ["GCSE straight-line gradients", "GCSE Pythagoras", "GCSE coordinates"],
  },
  "Sequences and series": {
    specPoints: [
      { code: "PM4.1", title: "Sequences, arithmetic & geometric series" },
      { code: "PM4.2", title: "Sigma notation, binomial expansion" },
    ],
    theme: REASONING,
    marksWeight: 0.06,
    prerequisites: ["GCSE nth-term formulae", "GCSE sums & products", "GCSE factorising"],
  },
  Trigonometry: {
    specPoints: [
      { code: "PM5.1", title: "Sine & cosine rule, area formula" },
      { code: "PM5.2", title: "Graphs, identities & equations" },
      { code: "PM5.3", title: "Inverse functions & solving in given ranges" },
    ],
    theme: REASONING,
    marksWeight: 0.12,
    prerequisites: ["GCSE trig ratios (SOH-CAH-TOA)", "GCSE angle facts", "GCSE solving equations"],
  },
  "Exponentials and logarithms": {
    specPoints: [
      { code: "PM6.1", title: "Exponential graphs & modelling" },
      { code: "PM6.2", title: "Log laws and solving exponential/log equations" },
    ],
    theme: FLUENCY,
    marksWeight: 0.05,
    prerequisites: ["GCSE index laws", "GCSE standard form", "GCSE solving equations"],
  },
  Differentiation: {
    specPoints: [
      { code: "PM7.1", title: "Differentiating polynomials" },
      { code: "PM7.2", title: "Chain, product & quotient rules" },
      { code: "PM7.3", title: "Applications: tangents, normals, stationary points" },
      { code: "PM7.4", title: "Connected rates of change" },
    ],
    theme: FLUENCY,
    marksWeight: 0.15,
    prerequisites: ["GCSE indices laws", "GCSE brackets & expanding", "GCSE algebraic fractions"],
  },
  Integration: {
    specPoints: [
      { code: "PM8.1", title: "Indefinite & definite integration" },
      { code: "PM8.2", title: "Integration as area; the trapezium rule" },
      { code: "PM8.3", title: "Reverse chain rule, solving differential equations" },
    ],
    theme: REASONING,
    marksWeight: 0.15,
    prerequisites: ["GCSE indices laws", "GCSE algebraic manipulation", "GCSE fractions"],
  },
  Vectors: {
    specPoints: [
      { code: "PM9.1", title: "2D & 3D vectors, magnitude, position vectors" },
      { code: "PM9.2", title: "Equations of lines; points on lines" },
    ],
    theme: PROBLEM,
    marksWeight: 0.04,
    prerequisites: ["GCSE solving simultaneous equations", "GCSE Pythagoras", "GCSE algebraic manipulation"],
  },
  "Numerical methods": {
    specPoints: [
      { code: "PM10.1", title: "Locating roots; fixed-point iteration" },
      { code: "PM10.2", title: "Numerical integration & approximation" },
    ],
    theme: PROBLEM,
    marksWeight: 0.04,
    prerequisites: ["GCSE rearranging formulae", "GCSE substitution", "GCSE rounding"],
  },
  "Statistical sampling": {
    specPoints: [
      { code: "S1.1", title: "Sampling methods, bias, sampling frames" },
    ],
    theme: REASONING,
    marksWeight: 0.03,
    lds: true,
    prerequisites: ["GCSE averages & spread", "GCSE percentages"],
  },
  "Data presentation and interpretation": {
    specPoints: [
      { code: "S2.1", title: "Histograms, cumulative frequency, box plots" },
      { code: "S2.2", title: "Correlation, regression, measures of spread" },
    ],
    theme: FLUENCY,
    marksWeight: 0.05,
    lds: true,
    prerequisites: ["GCSE averages & spread", "GCSE reading graphs", "GCSE percentages"],
  },
  Probability: {
    specPoints: [
      { code: "S3.1", title: "Venn diagrams, tree diagrams" },
      { code: "S3.2", title: "Conditional probability & independence" },
    ],
    theme: REASONING,
    marksWeight: 0.1,
    prerequisites: ["GCSE probability scale", "GCSE fractions", "GCSE tree diagrams"],
  },
  "Statistical distributions": {
    specPoints: [
      { code: "S4.1", title: "Binomial distribution" },
      { code: "S4.2", title: "Normal distribution & standardising" },
    ],
    theme: FLUENCY,
    marksWeight: 0.08,
    lds: true,
    prerequisites: ["GCSE probability", "GCSE standard form", "GCSE substitution"],
  },
  "Hypothesis testing": {
    specPoints: [
      { code: "S5.1", title: "H₀/H₁, p-values, significance levels" },
      { code: "S5.2", title: "Binomial & normal tests in context" },
    ],
    theme: PROBLEM,
    marksWeight: 0.06,
    lds: true,
    prerequisites: ["GCSE probability", "GCSE interpreting context"],
  },
  "Quantities and units": {
    specPoints: [
      { code: "M1.1", title: "SI units, scalars & vectors, significant figures" },
    ],
    theme: FLUENCY,
    marksWeight: 0.02,
    prerequisites: ["GCSE standard form", "GCSE units & conversion"],
  },
  Kinematics: {
    specPoints: [
      { code: "M2.1", title: "SUVAT equations; calculus in kinematics" },
      { code: "M2.2", title: "Vertical motion under gravity" },
    ],
    theme: FLUENCY,
    marksWeight: 0.05,
    prerequisites: ["GCSE solving equations", "GCSE graphs of motion", "GCSE substitution"],
  },
  "Forces and Newton's laws": {
    specPoints: [
      { code: "M3.1", title: "Newton's laws, friction, connected particles" },
      { code: "M3.2", title: "Resolving forces, inclined planes" },
    ],
    theme: PROBLEM,
    marksWeight: 0.05,
    prerequisites: ["GCSE trig ratios", "GCSE simultaneous equations", "GCSE factorising"],
  },
  Moments: {
    specPoints: [
      { code: "M4.1", title: "Moments, equilibrium of rigid bodies" },
    ],
    theme: PROBLEM,
    marksWeight: 0.02,
    prerequisites: ["GCSE forming equations from words", "GCSE linear equations"],
  },
};

export const DEFAULT_SPEC: ChapterSpec = {
  specPoints: [{ code: "GEN", title: "General specification content" }],
  theme: FLUENCY,
  marksWeight: 0.05,
  prerequisites: ["GCSE algebraic manipulation"],
};

export function specForChapter(chapter: string): ChapterSpec {
  return CHAPTER_SPEC[chapter] || DEFAULT_SPEC;
}

export function defaultSpecPoint(chapter: string): string {
  const spec = specForChapter(chapter);
  return `${spec.specPoints[0].code} ${spec.specPoints[0].title}`;
}
