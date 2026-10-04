import { describe, it, expect } from "vitest";
import { formatMarkdown } from "@/lib/utils";

describe("formatMarkdown", () => {
  it("should return empty string for null or empty input", () => {
    expect(formatMarkdown("")).toBe("");
  });

  it("should split merged rows with three or more pipes", () => {
    const input = "| col1 | col2 | | | col3 | col4 |";
    const result = formatMarkdown(input);
    expect(result).toContain("|\n| | col3 | col4 |");
  });

  it("should split unspaced merged pipes", () => {
    const input = "| col1 | col2 ||| col3 | col4 |";
    const result = formatMarkdown(input);
    expect(result).toContain("|\n|");
  });

  it("should clean up blank lines between table rows", () => {
    const input = "| row 1 col 1 | row 1 col 2 |\n\n| row 2 col 1 | row 2 col 2 |";
    const result = formatMarkdown(input);
    expect(result).toBe("| row 1 col 1 | row 1 col 2 |\n| row 2 col 1 | row 2 col 2 |");
  });

  it("should ensure a blank line before table preceded by text", () => {
    const input = "Here is some text:\n| Col 1 | Col 2 |\n| --- | --- |\n| Val 1 | Val 2 |";
    const result = formatMarkdown(input);
    expect(result).toBe("Here is some text:\n\n| Col 1 | Col 2 |\n| --- | --- |\n| Val 1 | Val 2 |");
  });
});
