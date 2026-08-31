"use server";

import {
  updateStudentProfile,
} from "@/lib/learning/student-profile";

type Board =
  | "CBSE"
  | "ICSE"
  | "UP_BOARD"
  | "OTHER";

type Language =
  | "English"
  | "Hindi"
  | "Hinglish";

export async function updateStudentProfileAction({
  fullName,
  programId,
  board,
  schoolName,
  preferredLanguage,
}: {
  fullName: string;
  programId: string;
  board: Board;
  schoolName: string | null;
  preferredLanguage: Language;
}) {
  return updateStudentProfile({
    fullName,
    programId,
    board,
    schoolName,
    preferredLanguage,
  });
}