"use server";

import {
  createStudentProfile,
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

export async function createStudentProfileAction({
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
  return createStudentProfile({
    fullName,
    programId,
    board,
    schoolName,
    preferredLanguage,
  });
}