import { EdexcelTopic, Level } from "@/types/question";

export const EDEXCEL_ALEVEL_CHAPTERS: Record<string, EdexcelTopic[]> = {
  "Pure Mathematics": [
    {
      id: "pm2",
      name: "Algebra and functions",
      chapter: "Algebra and functions",
      section: "Indices, surds, quadratics",
      module: "pure",
      year: 2026,
      specCode: "PM2",
      level: "year1",
    },
    {
      id: "pm3",
      name: "Coordinate geometry",
      chapter: "Coordinate geometry",
      section: "Straight lines, circles",
      module: "pure",
      year: 2026,
      specCode: "PM3",
      level: "year1",
    },
    {
      id: "pm4",
      name: "Sequences and series",
      chapter: "Sequences and series",
      section: "Arithmetic, geometric, binomial",
      module: "pure",
      year: 2026,
      specCode: "PM4",
      level: "year1",
    },
    {
      id: "pm5",
      name: "Trigonometry",
      chapter: "Trigonometry",
      section: "Identities, equations, graphs",
      module: "pure",
      year: 2026,
      specCode: "PM5",
      level: "year1",
    },
    {
      id: "pm6",
      name: "Exponentials and logarithms",
      chapter: "Exponentials and logarithms",
      section: "Exponential models, logs",
      module: "pure",
      year: 2026,
      specCode: "PM6",
      level: "year1",
    },
    {
      id: "pm7",
      name: "Differentiation",
      chapter: "Differentiation",
      section: "Derivatives, applications",
      module: "pure",
      year: 2026,
      specCode: "PM7",
      level: "year1",
    },
    {
      id: "pm8",
      name: "Integration",
      chapter: "Integration",
      section: "Indefinite, definite, areas",
      module: "pure",
      year: 2026,
      specCode: "PM8",
      level: "year1",
    },
    {
      id: "pm9",
      name: "Vectors",
      chapter: "Vectors",
      section: "2D, 3D vectors",
      module: "pure",
      year: 2026,
      specCode: "PM9",
      level: "year1",
    },
    {
      id: "pm1",
      name: "Proof",
      chapter: "Proof",
      section: "Mathematical argument",
      module: "pure",
      year: 2026,
      specCode: "PM1",
      level: "year2",
    },
    {
      id: "pm10",
      name: "Numerical methods",
      chapter: "Numerical methods",
      section: "Iteration, approximation",
      module: "pure",
      year: 2026,
      specCode: "PM10",
      level: "year2",
    },
  ],
  Statistics: [
    {
      id: "s1",
      name: "Statistical sampling",
      chapter: "Statistical sampling",
      section: "Sampling methods",
      module: "stats",
      year: 2026,
      specCode: "S1",
      level: "year1",
    },
    {
      id: "s2",
      name: "Data presentation and interpretation",
      chapter: "Data presentation and interpretation",
      section: "Graphs, measures",
      module: "stats",
      year: 2026,
      specCode: "S2",
      level: "year1",
    },
    {
      id: "s3",
      name: "Probability",
      chapter: "Probability",
      section: "Laws, distributions",
      module: "stats",
      year: 2026,
      specCode: "S3",
      level: "year1",
    },
    {
      id: "s4",
      name: "Statistical distributions",
      chapter: "Statistical distributions",
      section: "Binomial, normal",
      module: "stats",
      year: 2026,
      specCode: "S4",
      level: "year1",
    },
    {
      id: "s5",
      name: "Hypothesis testing",
      chapter: "Hypothesis testing",
      section: "Significance tests",
      module: "stats",
      year: 2026,
      specCode: "S5",
      level: "year1",
    },
  ],
  Mechanics: [
    {
      id: "m1",
      name: "Quantities and units",
      chapter: "Quantities and units",
      section: "SI units, scalars/vectors",
      module: "mechanics",
      year: 2026,
      specCode: "M1",
      level: "year1",
    },
    {
      id: "m2",
      name: "Kinematics",
      chapter: "Kinematics",
      section: "SUVAT, projectiles",
      module: "mechanics",
      year: 2026,
      specCode: "M2",
      level: "year1",
    },
    {
      id: "m3",
      name: "Forces and Newton's laws",
      chapter: "Forces and Newton's laws",
      section: "Equilibrium, dynamics",
      module: "mechanics",
      year: 2026,
      specCode: "M3",
      level: "year1",
    },
    {
      id: "m4",
      name: "Moments",
      chapter: "Moments",
      section: "Rotational equilibrium",
      module: "mechanics",
      year: 2026,
      specCode: "M4",
      level: "year2",
    },
  ],
};

export const ALL_CHAPTERS = Object.values(EDEXCEL_ALEVEL_CHAPTERS).flat();

export function findTopicByChapter(chapter: string): EdexcelTopic {
  const exact = ALL_CHAPTERS.find(
    (t) => t.chapter.toLowerCase() === chapter.toLowerCase()
  );
  if (exact) return exact;
  const partial = ALL_CHAPTERS.find(
    (t) =>
      t.chapter.toLowerCase().includes(chapter.toLowerCase()) ||
      chapter.toLowerCase().includes(t.chapter.toLowerCase())
  );
  return partial || ALL_CHAPTERS[0];
}

/** Question bank chapters carry the year of the book they are first taught in. */
export function topicLevelForChapter(chapter: string): Level {
  return findTopicByChapter(chapter).level;
}

export function chaptersForLevel(level: Level | "all"): EdexcelTopic[] {
  if (level === "all") return ALL_CHAPTERS;
  return ALL_CHAPTERS.filter((t) => t.level === level);
}

/* ---------------------------------------------------------------------------
 * Revision-book structure
 * The Pearson Edexcel A-Level maths revision guides publish four books:
 * Pure Y1/AS (14 chapters), Pure Y2 (12), and Stats & Mechanics Y1/AS (11)
 * and Y2 (8).  Each book chapter maps to one of the canonical question-bank
 * chapters above (its `chapter` key).
 * ------------------------------------------------------------------------- */

export interface BookInfo {
  id: "pure1" | "pure2" | "sm1" | "sm2";
  /** Display title exactly as the revision book reads. */
  title: string;
  level: Level;
}

export interface BookChapter {
  id: string;
  book: BookInfo["id"];
  module: EdexcelTopic["module"];
  level: Level;
  /** Chapter number inside its revision book. */
  number: number;
  /** Chapter name as printed in the revision book. */
  name: string;
  section: string;
  /** Canonical question-bank chapter key this maps to. */
  chapter: string;
}

export const CHAPTER_BOOKS: BookInfo[] = [
  { id: "pure1", title: "Pure Mathematics — Year 1/AS", level: "year1" },
  { id: "pure2", title: "Pure Mathematics — Year 2", level: "year2" },
  { id: "sm1", title: "Statistics & Mechanics — Year 1/AS", level: "year1" },
  { id: "sm2", title: "Statistics & Mechanics — Year 2", level: "year2" },
];

export const BOOK_CHAPTERS: BookChapter[] = [
  // Pure Mathematics Year 1/AS
  { id: "p1-1", book: "pure1", module: "pure", level: "year1", number: 1, name: "Algebraic expressions", section: "Indices, surds, expanding brackets", chapter: "Algebra and functions" },
  { id: "p1-2", book: "pure1", module: "pure", level: "year1", number: 2, name: "Quadratics", section: "Factorising, discriminant, drawing quadratic graphs", chapter: "Algebra and functions" },
  { id: "p1-3", book: "pure1", module: "pure", level: "year1", number: 3, name: "Equations and inequalities", section: "Simultaneous equations, linear & quadratic inequalities", chapter: "Algebra and functions" },
  { id: "p1-4", book: "pure1", module: "pure", level: "year1", number: 4, name: "Graphs and transformations", section: "Cubic, quartic & reciprocal graphs; transformations", chapter: "Algebra and functions" },
  { id: "p1-5", book: "pure1", module: "pure", level: "year1", number: 5, name: "Straight line graphs", section: "Gradient, midpoint, parallel & perpendicular lines", chapter: "Coordinate geometry" },
  { id: "p1-6", book: "pure1", module: "pure", level: "year1", number: 6, name: "Circles", section: "Equation of a circle, tangents, chords", chapter: "Coordinate geometry" },
  { id: "p1-7", book: "pure1", module: "pure", level: "year1", number: 7, name: "Algebraic methods", section: "Algebraic fractions, proof, partial fractions", chapter: "Proof" },
  { id: "p1-8", book: "pure1", module: "pure", level: "year1", number: 8, name: "The binomial expansion", section: "Pascal's triangle, nCr, expanding (a+b)ⁿ", chapter: "Sequences and series" },
  { id: "p1-9", book: "pure1", module: "pure", level: "year1", number: 9, name: "Trigonometric ratios", section: "Sine & cosine rule, area of a triangle", chapter: "Trigonometry" },
  { id: "p1-10", book: "pure1", module: "pure", level: "year1", number: 10, name: "Trigonometric identities and equations", section: "Identities, exact values, solving in a range", chapter: "Trigonometry" },
  { id: "p1-11", book: "pure1", module: "pure", level: "year1", number: 11, name: "Vectors", section: "2D vectors, magnitude, position vectors", chapter: "Vectors" },
  { id: "p1-12", book: "pure1", module: "pure", level: "year1", number: 12, name: "Differentiation", section: "Gradients, tangents & normals, stationary points", chapter: "Differentiation" },
  { id: "p1-13", book: "pure1", module: "pure", level: "year1", number: 13, name: "Integration", section: "Indefinite & definite integrals, areas", chapter: "Integration" },
  { id: "p1-14", book: "pure1", module: "pure", level: "year1", number: 14, name: "Exponentials and logarithms", section: "Exponential graphs, log laws, equations", chapter: "Exponentials and logarithms" },

  // Pure Mathematics Year 2
  { id: "p2-1", book: "pure2", module: "pure", level: "year2", number: 1, name: "Algebraic methods", section: "Proof, partial fractions, algebraic division", chapter: "Proof" },
  { id: "p2-2", book: "pure2", module: "pure", level: "year2", number: 2, name: "Functions and graphs", section: "Composite & inverse functions, modulus, ranges", chapter: "Algebra and functions" },
  { id: "p2-3", book: "pure2", module: "pure", level: "year2", number: 3, name: "Sequences and series", section: "Arithmetic & geometric sequences, sigma notation", chapter: "Sequences and series" },
  { id: "p2-4", book: "pure2", module: "pure", level: "year2", number: 4, name: "Binomial expansion", section: "Binomial expansion with fractional & negative powers", chapter: "Sequences and series" },
  { id: "p2-5", book: "pure2", module: "pure", level: "year2", number: 5, name: "Radians", section: "Radians, arcs, sectors, small-angle approximations", chapter: "Trigonometry" },
  { id: "p2-6", book: "pure2", module: "pure", level: "year2", number: 6, name: "Trigonometric functions", section: "Sec, cosec & cot, inverse trig functions", chapter: "Trigonometry" },
  { id: "p2-7", book: "pure2", module: "pure", level: "year2", number: 7, name: "Trigonometry and modelling", section: "Addition formulae, double angles, R sin(θ ± α)", chapter: "Trigonometry" },
  { id: "p2-8", book: "pure2", module: "pure", level: "year2", number: 8, name: "Parametric equations", section: "Parametric equations, eliminating the parameter", chapter: "Algebra and functions" },
  { id: "p2-9", book: "pure2", module: "pure", level: "year2", number: 9, name: "Differentiation", section: "Chain, product & quotient rule; trig, exp & log derivatives", chapter: "Differentiation" },
  { id: "p2-10", book: "pure2", module: "pure", level: "year2", number: 10, name: "Numerical methods", section: "Locating roots, iteration, numerical integration", chapter: "Numerical methods" },
  { id: "p2-11", book: "pure2", module: "pure", level: "year2", number: 11, name: "Integration", section: "Reverse chain rule, substitution, by parts, differential equations", chapter: "Integration" },
  { id: "p2-12", book: "pure2", module: "pure", level: "year2", number: 12, name: "Vectors", section: "3D vectors, equations of lines in 3D", chapter: "Vectors" },

  // Statistics & Mechanics Year 1/AS
  { id: "sm1-1", book: "sm1", module: "stats", level: "year1", number: 1, name: "Data collection", section: "Sampling methods, bias, sampling frames", chapter: "Statistical sampling" },
  { id: "sm1-2", book: "sm1", module: "stats", level: "year1", number: 2, name: "Measures of location and spread", section: "Mean, median, quartiles, variance, outliers", chapter: "Data presentation and interpretation" },
  { id: "sm1-3", book: "sm1", module: "stats", level: "year1", number: 3, name: "Representations of data", section: "Histograms, cumulative frequency, box plots, correlation", chapter: "Data presentation and interpretation" },
  { id: "sm1-4", book: "sm1", module: "stats", level: "year1", number: 4, name: "Correlation", section: "Scatter diagrams, product-moment correlation", chapter: "Data presentation and interpretation" },
  { id: "sm1-5", book: "sm1", module: "stats", level: "year1", number: 5, name: "Probability", section: "Venn diagrams, tree diagrams, mutually exclusive events", chapter: "Probability" },
  { id: "sm1-6", book: "sm1", module: "stats", level: "year1", number: 6, name: "Statistical distributions", section: "The binomial distribution", chapter: "Statistical distributions" },
  { id: "sm1-7", book: "sm1", module: "stats", level: "year1", number: 7, name: "Hypothesis testing", section: "Binomial hypothesis tests, critical regions", chapter: "Hypothesis testing" },
  { id: "sm1-8", book: "sm1", module: "mechanics", level: "year1", number: 8, name: "Modelling in mechanics", section: "SI units, scalars & vectors, assumptions", chapter: "Quantities and units" },
  { id: "sm1-9", book: "sm1", module: "mechanics", level: "year1", number: 9, name: "Constant acceleration", section: "SUVAT equations, displacement-time & velocity-time graphs", chapter: "Kinematics" },
  { id: "sm1-10", book: "sm1", module: "mechanics", level: "year1", number: 10, name: "Forces and motion", section: "Newton's laws, resistance, connected particles", chapter: "Forces and Newton's laws" },
  { id: "sm1-11", book: "sm1", module: "mechanics", level: "year1", number: 11, name: "Variable acceleration", section: "Differentiation & integration in kinematics", chapter: "Kinematics" },

  // Statistics & Mechanics Year 2
  { id: "sm2-1", book: "sm2", module: "stats", level: "year2", number: 1, name: "Regression, correlation and hypothesis testing", section: "Exponential models, correlation tests", chapter: "Data presentation and interpretation" },
  { id: "sm2-2", book: "sm2", module: "stats", level: "year2", number: 2, name: "Conditional probability", section: "Conditional probability, set notation, independence", chapter: "Probability" },
  { id: "sm2-3", book: "sm2", module: "stats", level: "year2", number: 3, name: "The normal distribution", section: "Normal distribution, standardising, inverse normal", chapter: "Statistical distributions" },
  { id: "sm2-4", book: "sm2", module: "mechanics", level: "year2", number: 4, name: "Moments", section: "Moments, equilibrium of rigid bodies", chapter: "Moments" },
  { id: "sm2-5", book: "sm2", module: "mechanics", level: "year2", number: 5, name: "Forces and friction", section: "Friction, coefficient of friction, equilibrium", chapter: "Forces and Newton's laws" },
  { id: "sm2-6", book: "sm2", module: "mechanics", level: "year2", number: 6, name: "Projectiles", section: "Projectile motion, horizontal & vertical components", chapter: "Kinematics" },
  { id: "sm2-7", book: "sm2", module: "mechanics", level: "year2", number: 7, name: "Applications of forces", section: "Resolving forces, inclined planes, connected particles", chapter: "Forces and Newton's laws" },
  { id: "sm2-8", book: "sm2", module: "mechanics", level: "year2", number: 8, name: "Further kinematics", section: "Vector kinematics, calculus in 2D motion", chapter: "Kinematics" },
];

export function chaptersInBook(book: BookInfo["id"], level?: Level | "all"): BookChapter[] {
  return BOOK_CHAPTERS.filter(
    (c) => c.book === book && (!level || level === "all" || c.level === level)
  );
}

export function specCodeForBookChapter(chapter: BookChapter): string {
  return findTopicByChapter(chapter.chapter).specCode;
}