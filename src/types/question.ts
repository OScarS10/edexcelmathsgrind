export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 
  | 'algebra' 
  | 'calculus' 
  | 'statistics' 
  | 'mechanics' 
  | 'geometry' 
  | 'trigonometry'
  | 'pure'
  | 'applied';

export type Level = 'year1' | 'year2';

export type EdexcelTopic = {
  id: string;
  name: string;
  chapter: string;
  section: string;
  module: 'pure' | 'stats' | 'mechanics';
  year: number;
  specCode: string;
  /** Course year the chapter is taught in, matching the Pearson revision books. */
  level: Level;
};

export interface QuestionOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface QuestionStep {
  id: string;
  explanation: string;
  formula?: string;
  working?: string;
}

export type ExamTheme =
  | "Understanding and fluency"
  | "Thinking and reasoning"
  | "Problem solving";

export type MarkType = "M" | "A" | "B" | "dM";

export interface MarkComponent {
  type: MarkType;
  marks: number;
  note: string;
}

export interface PrecisionSpec {
  exact?: boolean;
  units?: string;
  sf?: number;
  dp?: number;
}

export interface SolvabilityCheck {
  isSolvable: boolean;
  issues: string[];
  confidence: number;
  estimatedDifficulty: QuestionDifficulty;
  prerequisites: string[];
}

export interface GeneratedQuestion {
  id: string;
  title: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  topics: EdexcelTopic[];
  marks: number;
  examBoard: 'Edexcel';
  specification: 'A-Level GCE';
  year: number | 'generated';
  source: 'real-exam-inspired' | 'ai-generated';
  options?: QuestionOption[];
  answer: string | number | string[];
  method?: string;
  steps?: QuestionStep[];
  formulaSheetAllowed: boolean;
  calculatorAllowed: boolean;
  chapter: string;
  subChapter: string;
  tags: string[];
  specPoint?: string;
  theme?: ExamTheme;
  commandWords?: string[];
  precision?: PrecisionSpec;
  markScheme?: MarkComponent[];
  lds?: boolean;
  verified?: boolean;
  extension?: 'tmua';
  foundation?: boolean;
  metadata: {
    solvability: SolvabilityCheck;
    generationModel: string;
    createdAt: Date;
  };
}
