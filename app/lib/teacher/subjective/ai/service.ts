import {
  getSubjectiveAiProvider,
} from "./provider";

import type {
  SubjectiveAiEvaluationInput,
  SubjectiveAiEvaluationResult,
} from "./types";

function normalizeMarks(
  marks: number,
  maxMarks: number,
): number {
  if (!Number.isFinite(marks)) {
    return 0;
  }

  const clamped =
    Math.min(
      Math.max(marks, 0),
      maxMarks,
    );

  return Math.round(clamped * 2) / 2;
}

function normalizeResult(
  result: SubjectiveAiEvaluationResult,
  maxMarks: number,
): SubjectiveAiEvaluationResult {
  return {
    ...result,

    suggestedMarks:
      normalizeMarks(
        result.suggestedMarks,
        maxMarks,
      ),

    feedback:
      result.feedback.trim(),

    scoreReason:
      result.scoreReason.trim(),

    conceptUnderstanding:
      result.conceptUnderstanding.trim(),

    strengths:
      result.strengths
        .map((item) => item.trim())
        .filter(Boolean),

    mistakes:
      result.mistakes
        .map((item) => item.trim())
        .filter(Boolean),

    missingSteps:
      result.missingSteps
        .map((item) => item.trim())
        .filter(Boolean),
  };
}

export async function evaluateSubjectiveWithAi(
  input: SubjectiveAiEvaluationInput,
): Promise<SubjectiveAiEvaluationResult> {
  if (!input.evaluationId) {
    throw new Error(
      "Evaluation ID is required.",
    );
  }

  if (!input.questionText.trim()) {
    throw new Error(
      "Question text is required for AI evaluation.",
    );
  }

  if (
    !Number.isFinite(input.maxMarks) ||
    input.maxMarks <= 0
  ) {
    throw new Error(
      "A valid maximum marks value is required.",
    );
  }

  const provider =
    getSubjectiveAiProvider();

  const result =
    await provider.evaluate(input);

  return normalizeResult(
    result,
    input.maxMarks,
  );
}