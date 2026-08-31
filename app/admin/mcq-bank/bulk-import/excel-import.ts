import * as XLSX from "xlsx";

import type { BulkMcqInput } from "@/app/lib/admin/mcq-bank/mcq-bulk-import.actions";

const REQUIRED_HEADERS = [
  "question_text",
  "option_A",
  "option_B",
  "option_C",
  "option_D",
  "correct_option",
] as const;

const OPTIONAL_HEADERS = [
  "source_type",
  "source_reference",
  "difficulty",
  "marks",
  "estimated_time_minutes",
  "solution_text",
  "mistake_insight",
] as const;

const ALLOWED_HEADERS = new Set<string>([
  ...REQUIRED_HEADERS,
  ...OPTIONAL_HEADERS,
]);

const ALLOWED_SOURCE_TYPES = new Set([
  "ORIGINAL",
  "PYQ",
  "PRACTICE",
]);

const ALLOWED_DIFFICULTIES = new Set([
  "EASY",
  "MEDIUM",
  "HARD",
]);

const ALLOWED_CORRECT_OPTIONS = new Set([
  "A",
  "B",
  "C",
  "D",
]);

export type ExcelImportError = {
  row: number;
  column?: string;
  message: string;
};

export type ExcelImportResult =
  | {
      success: true;
      questions: BulkMcqInput[];
      rowCount: number;
    }
  | {
      success: false;
      errors: ExcelImportError[];
    };

type RawExcelRow = Record<string, unknown>;

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "_");
}

function textValue(
  row: RawExcelRow,
  key: string
): string {
  const value = row[key];

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function optionalTextValue(
  row: RawExcelRow,
  key: string
): string | undefined {
  const value = textValue(row, key);

  return value || undefined;
}

function parseOptionalNumber(
  row: RawExcelRow,
  key: string,
  rowNumber: number,
  errors: ExcelImportError[],
  options: {
    integer?: boolean;
    greaterThanZero?: boolean;
    nonNegative?: boolean;
  } = {}
): number | undefined {
  const raw = textValue(row, key);

  if (!raw) {
    return undefined;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    errors.push({
      row: rowNumber,
      column: key,
      message: `${key} must be a valid number.`,
    });

    return undefined;
  }

  if (
    options.integer &&
    !Number.isInteger(value)
  ) {
    errors.push({
      row: rowNumber,
      column: key,
      message: `${key} must be an integer.`,
    });

    return undefined;
  }

  if (
    options.greaterThanZero &&
    value <= 0
  ) {
    errors.push({
      row: rowNumber,
      column: key,
      message: `${key} must be greater than 0.`,
    });

    return undefined;
  }

  if (
    options.nonNegative &&
    value < 0
  ) {
    errors.push({
      row: rowNumber,
      column: key,
      message: `${key} cannot be negative.`,
    });

    return undefined;
  }

  return value;
}

function validateHeaders(
  headers: string[]
): ExcelImportError[] {
  const errors: ExcelImportError[] = [];

  const seen = new Set<string>();

  for (const header of headers) {
    if (!header) {
      errors.push({
        row: 1,
        message: "The Excel file contains an empty column header.",
      });

      continue;
    }

    if (seen.has(header)) {
      errors.push({
        row: 1,
        column: header,
        message: `Duplicate column header "${header}".`,
      });
    }

    seen.add(header);

    if (!ALLOWED_HEADERS.has(header)) {
      errors.push({
        row: 1,
        column: header,
        message: `Unknown column "${header}".`,
      });
    }
  }

  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!seen.has(requiredHeader)) {
      errors.push({
        row: 1,
        column: requiredHeader,
        message: `Required column "${requiredHeader}" is missing.`,
      });
    }
  }

  return errors;
}

export function parseExcelMcqFile(
  file: File
): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result;

        if (!(result instanceof ArrayBuffer)) {
          resolve({
            success: false,
            errors: [
              {
                row: 1,
                message:
                  "Could not read the Excel file.",
              },
            ],
          });

          return;
        }

        const workbook = XLSX.read(
          result,
          {
            type: "array",
            cellDates: false,
          }
        );

        if (
          workbook.SheetNames.length === 0
        ) {
          resolve({
            success: false,
            errors: [
              {
                row: 1,
                message:
                  "The Excel workbook does not contain a worksheet.",
              },
            ],
          });

          return;
        }

        const firstSheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[firstSheetName];

        const rawRows =
          XLSX.utils.sheet_to_json<RawExcelRow>(
            worksheet,
            {
              defval: "",
              raw: false,
            }
          );

        const range =
          XLSX.utils.decode_range(
            worksheet["!ref"] ?? "A1"
          );

        const headerRow =
          XLSX.utils.sheet_to_json<
            unknown[]
          >(worksheet, {
            header: 1,
            defval: "",
            raw: false,
            range: {
              s: {
                r: 0,
                c: range.s.c,
              },
              e: {
                r: 0,
                c: range.e.c,
              },
            },
          })[0] ?? [];

        const headers =
          headerRow.map(normalizeHeader);

        const headerErrors =
          validateHeaders(headers);

        if (headerErrors.length > 0) {
          resolve({
            success: false,
            errors: headerErrors,
          });

          return;
        }

        const questions: BulkMcqInput[] = [];
        const errors: ExcelImportError[] = [];

        rawRows.forEach(
          (row, index) => {
            const rowNumber = index + 2;

            const questionText =
              textValue(
                row,
                "question_text"
              );

            const optionA =
              textValue(row, "option_A");

            const optionB =
              textValue(row, "option_B");

            const optionC =
              textValue(row, "option_C");

            const optionD =
              textValue(row, "option_D");

            const correctOption =
              textValue(
                row,
                "correct_option"
              ).toUpperCase();

            if (!questionText) {
              errors.push({
                row: rowNumber,
                column: "question_text",
                message:
                  "Question text is required.",
              });
            }

            const options = [
              {
                key: "A" as const,
                text: optionA,
              },
              {
                key: "B" as const,
                text: optionB,
              },
              {
                key: "C" as const,
                text: optionC,
              },
              {
                key: "D" as const,
                text: optionD,
              },
            ];

            for (const option of options) {
              if (!option.text) {
                errors.push({
                  row: rowNumber,
                  column: `option_${option.key}`,
                  message: `Option ${option.key} is required.`,
                });
              }
            }

            if (
              !ALLOWED_CORRECT_OPTIONS.has(
                correctOption
              )
            ) {
              errors.push({
                row: rowNumber,
                column: "correct_option",
                message:
                  "correct_option must be A, B, C or D.",
              });
            }

            const sourceTypeRaw =
              textValue(
                row,
                "source_type"
              ).toUpperCase();

            const sourceType =
              sourceTypeRaw || "ORIGINAL";

            if (
              !ALLOWED_SOURCE_TYPES.has(
                sourceType
              )
            ) {
              errors.push({
                row: rowNumber,
                column: "source_type",
                message:
                  "source_type must be ORIGINAL, PYQ or PRACTICE.",
              });
            }

            const difficultyRaw =
              textValue(
                row,
                "difficulty"
              ).toUpperCase();

            const difficulty =
              difficultyRaw || undefined;

            if (
              difficulty &&
              !ALLOWED_DIFFICULTIES.has(
                difficulty
              )
            ) {
              errors.push({
                row: rowNumber,
                column: "difficulty",
                message:
                  "difficulty must be EASY, MEDIUM or HARD.",
              });
            }

            const marks =
              parseOptionalNumber(
                row,
                "marks",
                rowNumber,
                errors,
                {
                  greaterThanZero: true,
                }
              );

            const estimatedTimeMinutes =
              parseOptionalNumber(
                row,
                "estimated_time_minutes",
                rowNumber,
                errors,
                {
                  integer: true,
                  nonNegative: true,
                }
              );

            questions.push({
              questionText,
              sourceType:
                sourceType as
                  | "ORIGINAL"
                  | "PYQ"
                  | "PRACTICE",
              sourceReference:
                optionalTextValue(
                  row,
                  "source_reference"
                ),
              difficulty:
                difficulty as
                  | "EASY"
                  | "MEDIUM"
                  | "HARD"
                  | undefined,
              marks,
              estimatedTimeMinutes,
              solutionText:
                optionalTextValue(
                  row,
                  "solution_text"
                ),
              mistakeInsight:
                optionalTextValue(
                  row,
                  "mistake_insight"
                ),
              options: options.map(
                (option, optionIndex) => ({
                  optionKey:
                    option.key,
                  optionText:
                    option.text,
                  displayOrder:
                    optionIndex + 1,
                  isCorrect:
                    correctOption ===
                    option.key,
                })
              ),
            });
          }
        );

        if (errors.length > 0) {
          resolve({
            success: false,
            errors,
          });

          return;
        }

        if (questions.length === 0) {
          resolve({
            success: false,
            errors: [
              {
                row: 1,
                message:
                  "The Excel file does not contain any MCQ rows.",
              },
            ],
          });

          return;
        }

        resolve({
          success: true,
          questions,
          rowCount: questions.length,
        });
      } catch (error) {
        resolve({
          success: false,
          errors: [
            {
              row: 1,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to parse the Excel file.",
            },
          ],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: [
          {
            row: 1,
            message:
              "Failed to read the Excel file.",
          },
        ],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}