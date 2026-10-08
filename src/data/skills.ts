import { Level } from "@/types/question";

export type SkillFamily = "pure" | "applied" | "reasoning";

export interface Skill {
  id: string;
  name: string;
  blurb: string;
  family: SkillFamily;
  level: Level | "both";
  /** lucide icon key — resolved to components in the UI. */
  icon: string;
  /** Canonical question-bank chapters this skill draws its questions from. */
  chapters: string[];
  highYield?: boolean;
}

export const SKILLS: Skill[] = [
  {
    id: "differentiation",
    name: "Differentiation",
    blurb: "Gradients, tangents & normals, stationary points, then chain, product & quotient rule, rates of change.",
    family: "pure",
    level: "both",
    icon: "TrendingUp",
    chapters: ["Differentiation"],
    highYield: true,
  },
  {
    id: "integration",
    name: "Integration",
    blurb: "Antidifferentiation, definite integrals and area, the trapezium rule, and solving differential equations.",
    family: "pure",
    level: "both",
    icon: "ChartArea",
    chapters: ["Integration", "Numerical methods"],
    highYield: true,
  },
  {
    id: "graphs",
    name: "Graphs & transformations",
    blurb: "Sketching curves, intercepts and asymptotes, graph transformations, and reading gradient/area off graphs.",
    family: "pure",
    level: "both",
    icon: "LineChart",
    chapters: ["Algebra and functions", "Coordinate geometry", "Trigonometry"],
  },
  {
    id: "algebra",
    name: "Algebraic manipulation",
    blurb: "Indices, surds, factorising, algebraic fractions, rearranging and identities — the machinery under everything.",
    family: "pure",
    level: "year1",
    icon: "Braces",
    chapters: ["Algebra and functions", "Proof"],
  },
  {
    id: "trigonometry",
    name: "Trigonometry",
    blurb: "Sine & cosine rule, identities, solving equations in a range, radians and modelling with R sin(θ ± α).",
    family: "pure",
    level: "both",
    icon: "Triangle",
    chapters: ["Trigonometry"],
    highYield: true,
  },
  {
    id: "logs",
    name: "Exponentials & logarithms",
    blurb: "Log laws, solving exponential equations, and building or inverting exponential models.",
    family: "pure",
    level: "year1",
    icon: "Infinity",
    chapters: ["Exponentials and logarithms"],
  },
  {
    id: "sequences",
    name: "Sequences & series",
    blurb: "Arithmetic and geometric progressions, sigma notation, recurrence, and the binomial expansion.",
    family: "pure",
    level: "both",
    icon: "ListOrdered",
    chapters: ["Sequences and series"],
  },
  {
    id: "vectors",
    name: "Vectors",
    blurb: "2D & 3D vectors, magnitude, position vectors and equations of straight lines in vector form.",
    family: "pure",
    level: "both",
    icon: "MoveUpRight",
    chapters: ["Vectors"],
  },
  {
    id: "coordinate",
    name: "Coordinate geometry",
    blurb: "Straight-line graphs, gradients, perpendicular lines, and the equation of a circle.",
    family: "pure",
    level: "year1",
    icon: "CircleDot",
    chapters: ["Coordinate geometry"],
  },
  {
    id: "statistics",
    name: "Statistics & data",
    blurb: "Sampling, measures and data representation, probability, distributions and hypothesis testing.",
    family: "applied",
    level: "both",
    icon: "BarChart3",
    chapters: [
      "Statistical sampling",
      "Data presentation and interpretation",
      "Probability",
      "Statistical distributions",
      "Hypothesis testing",
    ],
    highYield: true,
  },
  {
    id: "mechanics",
    name: "Mechanics",
    blurb: "SUVAT and kinematics, Newton's laws, forces, resolving, projectiles and moments.",
    family: "applied",
    level: "both",
    icon: "Gauge",
    chapters: [
      "Quantities and units",
      "Kinematics",
      "Forces and Newton's laws",
      "Moments",
    ],
  },
  {
    id: "problem-solving",
    name: "Problem solving & reasoning",
    blurb: "Proof, iteration and non-routine problems — the skills that separate A from A*.",
    family: "reasoning",
    level: "year2",
    icon: "Puzzle",
    chapters: ["Proof", "Numerical methods", "Probability"],
  },
];

export const SKILL_FAMILIES: { id: SkillFamily; title: string; blurb: string }[] = [
  {
    id: "pure",
    title: "Pure techniques",
    blurb: "The machinery of A-Level maths — calculus, algebra, trigonometry and geometry.",
  },
  {
    id: "applied",
    title: "Applied skills",
    blurb: "Statistics and mechanics: working with data, distributions and physical models.",
  },
  {
    id: "reasoning",
    title: "Problem solving & reasoning",
    blurb: "Proof, iteration and unfamiliar problems — a third of the paper's marks.",
  },
];

export function skillById(id: string | null | undefined): Skill | undefined {
  if (!id) return undefined;
  return SKILLS.find((s) => s.id === id);
}

export function chaptersForSkill(skill: Skill): string[] {
  return skill.chapters;
}