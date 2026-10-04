import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMarkdown(text: string): string {
  if (!text) return "";
  let formatted = text;

  // 1. Separate merged rows with 3+ pipes: e.g. '... trial possible. | | | 95 | ...'
  formatted = formatted.replace(/\|[^\S\r\n]*\|[^\S\r\n]*\|[^\S\r\n]*/g, "|\n| | ");

  // 2. Separate merged rows with 2 pipes between content: e.g. '... conduct. | | Information Technology Act ...'
  formatted = formatted.replace(/([^\r\n|])[^\S\r\n]*\|[^\S\r\n]*\|[^\S\r\n]*([^|\r\n])/g, "$1 |\n| $2");

  // 3. Separate unspaced merged pipes: e.g. '||'
  formatted = formatted.replace(/\|{2,}/g, "|\n|");

  // 4. Clean up any blank lines between table rows so the table body is not broken
  formatted = formatted.replace(/(\|\s*)\r?\n(?:[ \t]*\r?\n)+([ \t]*\|)/g, "$1\n$2");

  // 5. Ensure a blank line before a table only if preceded by non-table text
  formatted = formatted.replace(/([^\r\n|])[ \t]*\r?\n(\| ?[^\r\n]+\|[ \t]*\r?\n\| *[-:| ]+ *\|)/g, "$1\n\n$2");

  return formatted;
}
