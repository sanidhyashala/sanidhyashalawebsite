export function generateJournalIndex() {
  return `
export { articleHindi } from "./articleHindi";
export { articleEnglish } from "./articleEnglish";
export { meta } from "./meta";
`.trim();
}