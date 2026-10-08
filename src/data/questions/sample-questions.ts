import { GeneratedQuestion } from "@/types/question";

export const SAMPLE_QUESTIONS: GeneratedQuestion[] = [
  {
    id: "q1",
    title: "Quadratic factorisation",
    questionText: "Factorise $x^2 + 5x + 6$ completely.",
    questionType: "algebra",
    difficulty: "easy",
    topics: [
      {
        id: "pm2",
        name: "Algebra and functions",
        chapter: "Algebra and functions",
        section: "Quadratics",
module: "pure",
        year: 2026,
        specCode: "PM2",
        level: "year1",
      },
    ],
    marks: 2,
    examBoard: "Edexcel",
    specification: "A-Level GCE",
    year: "generated",
    source: "real-exam-inspired",
    answer: "$(x+2)(x+3)$",
    method: "Find two numbers that multiply to 6 and add to 5",
    steps: [
      {
        id: "s1",
        explanation: "Find factors of 6: 1,6,2,3",
        working: "1+6=7, 2+3=5 ?",
      },
      {
        id: "s2",
        explanation: "Write in factorised form",
        working: "(x+2)(x+3)",
      },
    ],
    formulaSheetAllowed: true,
    calculatorAllowed: false,
    chapter: "Algebra and functions",
    subChapter: "Quadratics",
    tags: ["factorisation", "quadratics"],
    metadata: {
      solvability: {
        isSolvable: true,
        issues: [],
        confidence: 0.98,
        estimatedDifficulty: "easy",
        prerequisites: ["expanding brackets"],
      },
      generationModel: "rule-based",
      createdAt: new Date(),
    },
  },
];
