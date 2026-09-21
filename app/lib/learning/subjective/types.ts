export type SubjectiveCategory =
  | "UNDERSTAND_APPLY"
  | "THINK_SOLVE"
  | "CASE_BASED";

export type SubjectiveAccessType =
  | "FREE"
  | "PREMIUM";

export type SubjectiveSetStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type SubjectiveAttemptType =
  | "INITIAL"
  | "PREMIUM_RETRY";

export type SubjectiveAttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "LOCKED"
  | "EVALUATED"
  | "ABANDONED";

export type SubjectiveSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "LOCKED";

export type SubjectiveEvaluationStatus =
  | "PENDING"
  | "AI_ASSISTED"
  | "TEACHER_REVIEW"
  | "EVALUATED";

export type SubjectiveResourceSummary = {
  resourceId: string;
  title: string;
  slug: string;
  description: string | null;
  accessType: string;
  status: string;
  setCount: number;
  chapterName: string | null;
  chapterSequence: number | null;
  session: string | null;
  className: string | null;
};

export type SubjectiveSetSummary = {
  id: string;
  resourceId: string;

  category: SubjectiveCategory;

  title: string;
  description: string | null;

  setNumber: number;
  displayOrder: number;

  status: SubjectiveSetStatus;
  accessType: SubjectiveAccessType;

  questionCount: number;
};

export type SubjectiveSetQuestion = {
  id: string;

  setId: string;

  questionId: string;
  questionRevisionId: string;

  questionOrder: number;
  marks: number;
};

export type SubjectiveAttemptSummary = {
  id: string;

  setId: string;

  userId: string;

  attemptNumber: number;
  attemptType: SubjectiveAttemptType;

  status: SubjectiveAttemptStatus;

  startedAt: string;
  submittedAt: string | null;
  evaluatedAt: string | null;
};

export type SubjectiveAttemptQuestion = {
  id: string;

  attemptId: string;

  questionId: string;
  questionRevisionId: string;

  questionOrder: number;
  marks: number;

  questionText: string;
};

export type SubjectiveSubmission = {
  id: string;

  attemptQuestionId: string;

  answerText: string | null;

  status: SubjectiveSubmissionStatus;

  submittedAt: string | null;
};

export type SubjectiveEvaluation = {
  id: string;

  submissionId: string;

  evaluationStatus: SubjectiveEvaluationStatus;

  aiSuggestedMarks: number | null;
  aiFeedback: string | null;
  aiAnalysis: Record<string, unknown> | null;

  teacherMarks: number | null;
  teacherFeedback: string | null;
  teacherNote: string | null;

  finalMarks: number | null;

  evaluatedBy: string | null;
  evaluatedAt: string | null;
};