import type {
  SubjectiveAiEvaluationInput,
  SubjectiveAiEvaluationResult,
  SubjectiveAiProvider,
} from "../types";

const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const DEFAULT_PRIMARY_MODEL = "gemini-3.8-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.6-flash";

const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_TIMEOUT_MS = 30_000;

const resultSchema = {
  type: "object",
  properties: {
    suggestedMarks: {
      type: "number",
      description:
        "Marks suggested by the AI. Must be between 0 and the maximum marks.",
    },

    feedback: {
      type: "string",
      description:
        "Clear teacher-style feedback explaining the quality of the student's solution.",
    },

    correctness: {
      type: "string",
      enum: [
        "CORRECT",
        "PARTIALLY_CORRECT",
        "INCORRECT",
        "NOT_ATTEMPTED",
      ],
    },

    scoreReason: {
      type: "string",
      description:
        "Concise explanation of why the suggested marks were awarded.",
    },

    strengths: {
      type: "array",
      items: {
        type: "string",
      },
    },

    mistakes: {
      type: "array",
      items: {
        type: "string",
      },
    },

    missingSteps: {
      type: "array",
      items: {
        type: "string",
      },
    },

    conceptUnderstanding: {
      type: "string",
      description:
        "Assessment of the student's conceptual understanding shown in the solution.",
    },
  },

  required: [
    "suggestedMarks",
    "feedback",
    "correctness",
    "scoreReason",
    "strengths",
    "mistakes",
    "missingSteps",
    "conceptUnderstanding",
  ],
};

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

function getPrimaryModel(): string {
  return (
    process.env.GEMINI_SUBJECTIVE_EVALUATION_MODEL?.trim() ||
    DEFAULT_PRIMARY_MODEL
  );
}

function getFallbackModel(): string {
  return (
    process.env.GEMINI_SUBJECTIVE_EVALUATION_FALLBACK_MODEL?.trim() ||
    DEFAULT_FALLBACK_MODEL
  );
}

function getMaxRetries(): number {
  const raw = Number(
    process.env.GEMINI_SUBJECTIVE_EVALUATION_MAX_RETRIES
  );

  if (!Number.isFinite(raw)) {
    return DEFAULT_MAX_RETRIES;
  }

  return Math.max(0, Math.min(Math.floor(raw), 3));
}

function getTimeoutMs(): number {
  const raw = Number(
    process.env.GEMINI_SUBJECTIVE_EVALUATION_TIMEOUT_MS
  );

  if (!Number.isFinite(raw)) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.max(10_000, Math.min(Math.floor(raw), 120_000));
}

function buildEvaluationPrompt(
  input: SubjectiveAiEvaluationInput
): string {
  return `
You are an AI evaluation assistant inside an educational platform called SanidhyaShala.

Your task is to evaluate a student's handwritten mathematics solution.

IMPORTANT ROLE:
- You are only an evaluation assistant.
- A teacher will review and make the final decision.
- Do not behave as the final authority.
- Do not invent steps that are not visible.
- If handwriting is unclear, explicitly say so.
- Give partial credit when the student's visible mathematical work deserves it.
- Do not penalize the student for formatting or handwriting style unless it prevents mathematical interpretation.
- Do not assume a missing step is wrong if the visible work logically establishes the result.
- Do not mark a correct mathematical approach as wrong merely because it differs from the ideal solution.
- Carefully inspect the student's actual submitted work.

QUESTION:
${input.questionText}

MAXIMUM MARKS:
${input.maxMarks}

IDEAL SOLUTION:
${input.idealSolution ?? "No ideal solution is available."}

MISTAKE INSIGHT:
${input.mistakeInsight ?? "No specific mistake insight is available."}

STUDENT ANSWER TEXT:
${
  input.studentAnswerText?.trim() ||
  "No typed answer was provided. Evaluate the submitted handwritten solution."
}

EVALUATION REQUIREMENTS:

1. Determine whether the solution is:
   - CORRECT
   - PARTIALLY_CORRECT
   - INCORRECT
   - NOT_ATTEMPTED

2. Suggest marks from 0 to ${input.maxMarks}.

3. Award partial marks where appropriate.

4. Check:
   - mathematical reasoning
   - formulas
   - calculations
   - intermediate steps
   - final answer
   - conceptual understanding

5. Identify genuine mistakes only.

6. Identify missing necessary steps only when they matter to the solution.

7. Keep feedback useful for a teacher reviewing the student's work.

8. Do not expose internal reasoning or hidden chain-of-thought.

Return ONLY the requested structured evaluation object.
`.trim();
}

function buildGeminiInput(
  input: SubjectiveAiEvaluationInput
): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: buildEvaluationPrompt(input),
    },
  ];

  for (const part of input.files) {
    if (part.type === "image") {
      parts.push({
        type: "image",
        data: part.data,
        mime_type: part.mimeType,
      });
    }

    if (part.type === "file") {
      parts.push({
        type: "document",
        data: part.data,
        mime_type: part.mimeType,
      });
    }
  }

  return parts;
}

function extractTextFromInteraction(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;

  /*
   * Current Interactions API convenience field.
   */
  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  /*
   * Defensive support for alternate response shapes.
   */
  if (typeof record.text === "string") {
    return record.text;
  }

  /*
   * Current REST response contains model_output steps.
   */
  if (Array.isArray(record.steps)) {
    for (const step of record.steps) {
      if (!step || typeof step !== "object") {
        continue;
      }

      const stepRecord = step as Record<string, unknown>;

      if (stepRecord.type !== "model_output") {
        continue;
      }

      if (Array.isArray(stepRecord.content)) {
        for (const content of stepRecord.content) {
          if (!content || typeof content !== "object") {
            continue;
          }

          const contentRecord =
            content as Record<string, unknown>;

          if (typeof contentRecord.text === "string") {
            return contentRecord.text;
          }
        }
      }
    }
  }

  /*
   * Defensive support for older/alternate output structures.
   */
  if (Array.isArray(record.outputs)) {
    for (const output of record.outputs) {
      if (!output || typeof output !== "object") {
        continue;
      }

      const outputRecord =
        output as Record<string, unknown>;

      if (
        outputRecord.type === "text" &&
        typeof outputRecord.text === "string"
      ) {
        return outputRecord.text;
      }

      if (typeof outputRecord.text === "string") {
        return outputRecord.text;
      }

      if (Array.isArray(outputRecord.content)) {
        for (const content of outputRecord.content) {
          if (!content || typeof content !== "object") {
            continue;
          }

          const contentRecord =
            content as Record<string, unknown>;

          if (typeof contentRecord.text === "string") {
            return contentRecord.text;
          }
        }
      }
    }
  }

  return "";
}

function cleanJsonText(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseResult(
  text: string
): SubjectiveAiEvaluationResult {
  const cleaned = cleanJsonText(text);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Gemini returned an invalid structured evaluation response."
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(
      "Gemini evaluation response is not an object."
    );
  }

  const result = parsed as Record<string, unknown>;

  const suggestedMarks = Number(
    result.suggestedMarks
  );

  if (!Number.isFinite(suggestedMarks)) {
    throw new Error(
      "Gemini did not return valid suggested marks."
    );
  }

  const correctness = result.correctness;

  if (
    correctness !== "CORRECT" &&
    correctness !== "PARTIALLY_CORRECT" &&
    correctness !== "INCORRECT" &&
    correctness !== "NOT_ATTEMPTED"
  ) {
    throw new Error(
      "Gemini returned an invalid correctness value."
    );
  }

  const asString = (value: unknown): string =>
    typeof value === "string"
      ? value.trim()
      : "";

  const asStringArray = (
    value: unknown
  ): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) => item.trim())
      .filter(Boolean);
  };

  return {
    suggestedMarks,
    feedback: asString(result.feedback),
    correctness,
    scoreReason: asString(
      result.scoreReason
    ),
    strengths: asStringArray(
      result.strengths
    ),
    mistakes: asStringArray(
      result.mistakes
    ),
    missingSteps: asStringArray(
      result.missingSteps
    ),
    conceptUnderstanding: asString(
      result.conceptUnderstanding
    ),
  };
}

function isRetryableStatus(
  status: number
): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function getErrorMessage(
  responseData: unknown,
  responseText: string
): string {
  if (
    responseData &&
    typeof responseData === "object" &&
    "error" in responseData
  ) {
    const errorValue = (
      responseData as Record<string, unknown>
    ).error;

    if (
      errorValue &&
      typeof errorValue === "object" &&
      "message" in errorValue &&
      typeof (
        errorValue as Record<string, unknown>
      ).message === "string"
    ) {
      return (
        errorValue as Record<string, string>
      ).message;
    }
  }

  return (
    responseText ||
    "Unknown Gemini API error."
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function requestGemini(
  model: string,
  input: SubjectiveAiEvaluationInput,
  apiKey: string
): Promise<SubjectiveAiEvaluationResult> {
  const maxRetries = getMaxRetries();
  const timeoutMs = getTimeoutMs();

  let lastError: Error | null = null;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt += 1
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      console.info(
        `[Subjective AI] Gemini request: model=${model}, attempt=${
          attempt + 1
        }/${maxRetries + 1}`
      );

      const response = await fetch(
        GEMINI_INTERACTIONS_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },

          body: JSON.stringify({
            model,

            input: buildGeminiInput(input),

            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: resultSchema,
            },
          }),

          cache: "no-store",

          signal: controller.signal,
        }
      );

      const responseText =
        await response.text();

      let responseData: unknown = null;

      try {
        responseData =
          JSON.parse(responseText);
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const message =
          getErrorMessage(
            responseData,
            responseText
          );

        const retryable =
          isRetryableStatus(
            response.status
          );

        lastError = new Error(
          `Gemini API request failed (${response.status}): ${message}`
        );

        console.warn(
          `[Subjective AI] Gemini ${model} request failed. ` +
            `status=${response.status}, ` +
            `retryable=${retryable}, ` +
            `attempt=${attempt + 1}`
        );

        /*
         * Do not retry non-transient errors.
         */
        if (!retryable) {
          throw lastError;
        }

        /*
         * If retry attempts remain, use a small
         * exponential backoff.
         */
        if (attempt < maxRetries) {
          const delayMs =
            attempt === 0
              ? 1500
              : 3500;

          console.info(
            `[Subjective AI] Retrying Gemini ${model} in ${delayMs}ms...`
          );

          await sleep(delayMs);
          continue;
        }

        throw lastError;
      }

      const outputText =
        extractTextFromInteraction(
          responseData
        );

      if (!outputText) {
        throw new Error(
          "Gemini returned no evaluation text in the interaction response."
        );
      }

      return parseResult(outputText);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        lastError = new Error(
          `Gemini request timed out after ${timeoutMs}ms.`
        );

        console.warn(
          `[Subjective AI] Gemini ${model} request timed out. ` +
            `attempt=${attempt + 1}`
        );

        /*
         * Timeout is treated as transient.
         */
        if (attempt < maxRetries) {
          const delayMs =
            attempt === 0
              ? 1500
              : 3500;

          await sleep(delayMs);
          continue;
        }

        throw lastError;
      }

      /*
       * Preserve validation / parsing / HTTP errors.
       */
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error(
          "Unknown Gemini evaluation error."
        );
      }

      /*
       * Errors thrown by parsing or validation are
       * not retried.
       */
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw (
    lastError ??
    new Error(
      "Gemini evaluation failed."
    )
  );
}

export const geminiSubjectiveAiProvider: SubjectiveAiProvider =
  {
    name: "gemini",

    async evaluate(
      input: SubjectiveAiEvaluationInput
    ): Promise<SubjectiveAiEvaluationResult> {
      const apiKey =
        getGeminiApiKey();

      const primaryModel =
        getPrimaryModel();

      const fallbackModel =
        getFallbackModel();

      /*
       * 1. Try the configured primary model.
       */
      try {
        return await requestGemini(
          primaryModel,
          input,
          apiKey
        );
      } catch (primaryError) {
        console.warn(
          "[Subjective AI] Primary Gemini model failed:",
          primaryError
        );

        /*
         * 2. If fallback is configured and is
         *    different from the primary model,
         *    try the fallback.
         */
        if (
          fallbackModel &&
          fallbackModel !== primaryModel
        ) {
          console.info(
            `[Subjective AI] Trying fallback model: ${fallbackModel}`
          );

          try {
            return await requestGemini(
              fallbackModel,
              input,
              apiKey
            );
          } catch (fallbackError) {
            console.error(
              "[Subjective AI] Fallback Gemini model also failed:",
              fallbackError
            );

            throw new Error(
              `Gemini AI evaluation failed on both models. ` +
                `Primary (${primaryModel}): ${
                  primaryError instanceof Error
                    ? primaryError.message
                    : "unknown error"
                } ` +
                `Fallback (${fallbackModel}): ${
                  fallbackError instanceof Error
                    ? fallbackError.message
                    : "unknown error"
                }`
            );
          }
        }

        throw primaryError;
      }
    },
  };