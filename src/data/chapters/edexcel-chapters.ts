import { EdexcelTopic } from "@/types/question";

export const EDEXCEL_ALEVEL_CHAPTERS: Record<string, EdexcelTopic[]> = {
  "Pure Mathematics": [
    {
      id: "pm1",
      name: "Proof",
      chapter: "Proof",
      section: "Mathematical argument",
      module: "pure",
      year: 2026,
      specCode: "PM1",
    },
    {
      id: "pm2",
      name: "Algebra and functions",
      chapter: "Algebra and functions",
      section: "Indices, surds, quadratics",
      module: "pure",
      year: 2026,
      specCode: "PM2",
    },
    {
      id: "pm3",
      name: "Coordinate geometry",
      chapter: "Coordinate geometry",
      section: "Straight lines, circles",
      module: "pure",
      year: 2026,
      specCode: "PM3",
    },
    {
      id: "pm4",
      name: "Sequences and series",
      chapter: "Sequences and series",
      section: "Arithmetic, geometric, binomial",
      module: "pure",
      year: 2026,
      specCode: "PM4",
    },
    {
      id: "pm5",
      name: "Trigonometry",
      chapter: "Trigonometry",
      section: "Identities, equations, graphs",
      module: "pure",
      year: 2026,
      specCode: "PM5",
    },
    {
      id: "pm6",
      name: "Exponentials and logarithms",
      chapter: "Exponentials and logarithms",
      section: "Exponential models, logs",
      module: "pure",
      year: 2026,
      specCode: "PM6",
    },
    {
      id: "pm7",
      name: "Differentiation",
      chapter: "Differentiation",
      section: "Derivatives, applications",
      module: "pure",
      year: 2026,
      specCode: "PM7",
    },
    {
      id: "pm8",
      name: "Integration",
      chapter: "Integration",
      section: "Indefinite, definite, areas",
      module: "pure",
      year: 2026,
      specCode: "PM8",
    },
    {
      id: "pm9",
      name: "Vectors",
      chapter: "Vectors",
      section: "2D, 3D vectors",
      module: "pure",
      year: 2026,
      specCode: "PM9",
    },
    {
      id: "pm10",
      name: "Numerical methods",
      chapter: "Numerical methods",
      section: "Iteration, approximation",
      module: "pure",
      year: 2026,
      specCode: "PM10",
    },
  ],
  "Statistics": [
    {
      id: "s1",
      name: "Statistical sampling",
      chapter: "Statistical sampling",
      section: "Sampling methods",
      module: "stats",
      year: 2026,
      specCode: "S1",
    },
    {
      id: "s2",
      name: "Data presentation and interpretation",
      chapter: "Data presentation and interpretation",
      section: "Graphs, measures",
      module: "stats",
      year: 2026,
      specCode: "S2",
    },
    {
      id: "s3",
      name: "Probability",
      chapter: "Probability",
      section: "Laws, distributions",
      module: "stats",
      year: 2026,
      specCode: "S3",
    },
    {
      id: "s4",
      name: "Statistical distributions",
      chapter: "Statistical distributions",
      section: "Binomial, normal",
      module: "stats",
      year: 2026,
      specCode: "S4",
    },
    {
      id: "s5",
      name: "Hypothesis testing",
      chapter: "Hypothesis testing",
      section: "Significance tests",
      module: "stats",
      year: 2026,
      specCode: "S5",
    },
  ],
  "Mechanics": [
    {
      id: "m1",
      name: "Quantities and units",
      chapter: "Quantities and units",
      section: "SI units, scalars/vectors",
      module: "mechanics",
      year: 2026,
      specCode: "M1",
    },
    {
      id: "m2",
      name: "Kinematics",
      chapter: "Kinematics",
      section: "SUVAT, projectiles",
      module: "mechanics",
      year: 2026,
      specCode: "M2",
    },
    {
      id: "m3",
      name: "Forces and Newton's laws",
      chapter: "Forces and Newton's laws",
      section: "Equilibrium, dynamics",
      module: "mechanics",
      year: 2026,
      specCode: "M3",
    },
    {
      id: "m4",
      name: "Moments",
      chapter: "Moments",
      section: "Rotational equilibrium",
      module: "mechanics",
      year: 2026,
      specCode: "M4",
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
