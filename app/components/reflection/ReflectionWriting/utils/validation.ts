export const MIN_REFLECTION_LENGTH = 20;
export const MAX_REFLECTION_LENGTH = 3000;

export function validateReflection(content: string) {
  const trimmed = content.trim();

  return {
    isValid:
      trimmed.length >= MIN_REFLECTION_LENGTH &&
      trimmed.length <= MAX_REFLECTION_LENGTH,

    length: trimmed.length,
  };
}