"use server";

import {
  saveLearningTestAnswer,
} from "@/lib/learning/answers";

import {
  submitLearningTestAttempt,
} from "@/lib/learning/submit";


export async function savePracticeAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  timeSpentSeconds: number | null
) {
  return saveLearningTestAnswer(
    attemptId,
    questionId,
    selectedOptionId,
    null,
    timeSpentSeconds
  );
}


export async function submitPracticeAttemptAction(
  attemptId: string
) {
  return submitLearningTestAttempt(
    attemptId
  );
}