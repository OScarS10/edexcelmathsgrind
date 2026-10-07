export interface SolvabilityFeatures {
  hasQuestionText: boolean;
  hasAnswer: boolean;
  hasSteps: boolean;
  hasMethod: boolean;
  hasMathNotation: boolean;
  hasInstructionVerb: boolean;
  bracketsBalanced: boolean;
  questionLength: number;
  stepsCount: number;
  marks: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
}

export class MLP {
  private weights: number[][][] = [];
  private biases: number[][] = [];

  constructor(
    private layerSizes: number[],
    seed = 42
  ) {
    const rand = seededRandom(seed);
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const scale = Math.sqrt(2 / layerSizes[i]);
      const w: number[][] = [];
      for (let r = 0; r < layerSizes[i + 1]; r++) {
        const row: number[] = [];
        for (let c = 0; c < layerSizes[i]; c++) {
          row.push((rand() * 2 - 1) * scale);
        }
        w.push(row);
      }
      this.weights.push(w);
      this.biases.push(new Array(layerSizes[i + 1]).fill(0));
    }
  }

  forward(input: number[]): number[] {
    let current = input;
    for (let l = 0; l < this.weights.length; l++) {
      const next: number[] = [];
      for (let r = 0; r < this.weights[l].length; r++) {
        let sum = this.biases[l][r];
        for (let c = 0; c < current.length; c++) {
          sum += this.weights[l][r][c] * current[c];
        }
        const isOutput = l === this.weights.length - 1;
        next.push(isOutput ? sigmoid(sum) : Math.max(0, sum));
      }
      current = next;
    }
    return current;
  }

  train(samples: { input: number[]; target: number[] }[], epochs: number, lr: number): number {
    let lastLoss = 0;
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      for (const sample of samples) {
        const activations: number[][] = [sample.input];
        let current = sample.input;
        for (let l = 0; l < this.weights.length; l++) {
          const next: number[] = [];
          for (let r = 0; r < this.weights[l].length; r++) {
            let sum = this.biases[l][r];
            for (let c = 0; c < current.length; c++) {
              sum += this.weights[l][r][c] * current[c];
            }
            const isOutput = l === this.weights.length - 1;
            next.push(isOutput ? sigmoid(sum) : Math.max(0, sum));
          }
          current = next;
          activations.push(current);
        }

        const output = current;
        for (let i = 0; i < output.length; i++) {
          const err = output[i] - sample.target[i];
          totalLoss += err * err;
        }

        let delta = output.map(
          (o, i) => (o - sample.target[i]) * o * (1 - o)
        );

        for (let l = this.weights.length - 1; l >= 0; l--) {
          const prevAct = activations[l];
          const newDelta: number[] = new Array(prevAct.length).fill(0);
          for (let r = 0; r < this.weights[l].length; r++) {
            for (let c = 0; c < prevAct.length; c++) {
              this.weights[l][r][c] -= lr * delta[r] * prevAct[c];
              newDelta[c] += this.weights[l][r][c] * delta[r];
            }
            this.biases[l][r] -= lr * delta[r];
          }
          delta = newDelta.map((d, i) => {
            const a = prevAct[i];
            return a > 0 ? d : 0;
          });
        }
      }
      lastLoss = totalLoss / samples.length;
    }
    return lastLoss;
  }
}

const INSTRUCTION_VERBS = [
  "solve",
  "find",
  "show",
  "prove",
  "calculate",
  "determine",
  "simplify",
  "factorise",
  "factorize",
  "expand",
  "differentiate",
  "integrate",
  "evaluate",
  "sketch",
  "hence",
  "verify",
  "state",
  "give",
];

export function extractFeatures(q: {
  questionText?: string;
  answer?: string | number | string[];
  steps?: { id: string; explanation: string }[];
  method?: string;
  marks?: number;
}): SolvabilityFeatures {
  const questionText = q.questionText || "";
  const answerStr = typeof q.answer === "string" ? q.answer : String(q.answer ?? "");
  const lower = questionText.toLowerCase();
  const openCount = (questionText.match(/\(/g) || []).length;
  const closeCount = (questionText.match(/\)/g) || []).length;

  return {
    hasQuestionText: questionText.trim().length > 10,
    hasAnswer: answerStr.trim().length > 0,
    hasSteps: (q.steps?.length || 0) > 0,
    hasMethod: !!q.method && q.method.trim().length > 0,
    hasMathNotation: /[$\\]|\^|=|\\frac|\\int/.test(questionText),
    hasInstructionVerb: INSTRUCTION_VERBS.some((v) => lower.includes(v)),
    bracketsBalanced: openCount === closeCount,
    questionLength: questionText.length,
    stepsCount: q.steps?.length || 0,
    marks: q.marks || 0,
  };
}

export function featuresToVector(f: SolvabilityFeatures): number[] {
  return [
    f.hasQuestionText ? 1 : 0,
    f.hasAnswer ? 1 : 0,
    f.hasSteps ? 1 : 0,
    f.hasMethod ? 1 : 0,
    f.hasMathNotation ? 1 : 0,
    f.hasInstructionVerb ? 1 : 0,
    f.bracketsBalanced ? 1 : 0,
    Math.min(f.questionLength / 500, 1),
    Math.min(f.stepsCount / 6, 1),
    Math.min(f.marks / 10, 1),
  ];
}

function synthesizeTrainingSet(): { input: number[]; target: number[] }[] {
  const rand = seededRandom(1234);
  const samples: { input: number[]; target: number[] }[] = [];

  for (let i = 0; i < 600; i++) {
    const hasQuestionText = rand() > 0.1;
    const hasAnswer = rand() > 0.15;
    const hasSteps = rand() > 0.3;
    const hasMethod = rand() > 0.5;
    const hasMathNotation = rand() > 0.25;
    const hasInstructionVerb = rand() > 0.3;
    const bracketsBalanced = rand() > 0.15;
    const questionLength = hasQuestionText ? 20 + rand() * 480 : rand() * 10;
    const stepsCount = hasSteps ? 1 + Math.floor(rand() * 5) : 0;
    const marks = 1 + Math.floor(rand() * 8);

    const utility =
      (hasQuestionText ? 3 : -4) +
      (hasAnswer ? 3 : -4) +
      (hasSteps ? 1.5 : -0.5) +
      (hasMethod ? 0.8 : 0) +
      (hasMathNotation ? 1 : -0.5) +
      (hasInstructionVerb ? 1 : -0.5) +
      (bracketsBalanced ? 0.5 : -2) +
      (questionLength > 30 && questionLength < 400 ? 1 : -0.5) +
      (stepsCount >= 1 ? 0.5 : -0.5) +
      (rand() - 0.5);

    const label = utility > 1 ? 1 : 0;
    const features = featuresToVector({
      hasQuestionText,
      hasAnswer,
      hasSteps,
      hasMethod,
      hasMathNotation,
      hasInstructionVerb,
      bracketsBalanced,
      questionLength,
      stepsCount,
      marks,
    });

    samples.push({ input: features, target: [label] });
  }

  return samples;
}

let singleton: SolvabilityNN | null = null;

export class SolvabilityNN {
  private network: MLP;
  private trained = false;
  readonly trainingLoss = 0;

  constructor() {
    this.network = new MLP([10, 16, 8, 1], 42);
  }

  static getInstance(): SolvabilityNN {
    if (!singleton) {
      singleton = new SolvabilityNN();
      singleton.ensureTrained();
    }
    return singleton;
  }

  ensureTrained(): void {
    if (this.trained) return;
    const data = synthesizeTrainingSet();
    this.network.train(data, 60, 0.15);
    this.trained = true;
  }

  predict(question: {
    questionText?: string;
    answer?: string | number | string[];
    steps?: { id: string; explanation: string }[];
    method?: string;
    marks?: number;
  }): { solvable: boolean; confidence: number } {
    this.ensureTrained();
    const vector = featuresToVector(extractFeatures(question));
    const [confidence] = this.network.forward(vector);
    return {
      solvable: confidence >= 0.5,
      confidence: Math.round(confidence * 1000) / 1000,
    };
  }
}
