export type SubjectiveAiProviderName =
  | "gemini"
  | "openai";

export type SubjectiveAiInputPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      mimeType: "image/jpeg" | "image/png";
      data: string;
    }
  | {
      type: "file";
      mimeType: "application/pdf";
      data: string;
    };

export type SubjectiveAiEvaluationInput = {
  evaluationId: string;

  questionText: string;
  idealSolution: string | null;
  mistakeInsight: string | null;

  studentAnswerText: string | null;

  maxMarks: number;

  files: SubjectiveAiInputPart[];
};

export type SubjectiveAiEvaluationResult = {
  suggestedMarks: number;

  feedback: string;

  correctness:
    | "CORRECT"
    | "PARTIALLY_CORRECT"
    | "INCORRECT"
    | "NOT_ATTEMPTED";

  scoreReason: string;

  strengths: string[];

  mistakes: string[];

  missingSteps: string[];

  conceptUnderstanding: string;
};

export type SubjectiveAiProvider = {
  readonly name: SubjectiveAiProviderName;

  evaluate(
    input: SubjectiveAiEvaluationInput,
  ): Promise<SubjectiveAiEvaluationResult>;
};