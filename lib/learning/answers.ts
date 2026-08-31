import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function saveLearningTestAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null = null,
  answerText: string | null = null,
  timeSpentSeconds: number | null = null
) {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc("save_test_answer", {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option_id: selectedOptionId,
    p_answer_text: answerText,
    p_time_spent_seconds: timeSpentSeconds,
  });

  if (error) {
    throw new Error(
      `Failed to save test answer: ${error.message}`
    );
  }

  return data;
}