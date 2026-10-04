import { describe, it, expect } from "vitest";
import { buildAnswerPdf, parseMarkdown, toPdfText } from "@/lib/pdf";

const answer = `**Direct Answer**
Under the BNS, murder is punishable with death or life imprisonment 😀 and a fine of ₹5,000 – “see §103”.

**Key Provisions**
| Act | Section | Text |
|-----|---------|------|
| BNS | 103 | Whoever commits murder shall be punished with death |
| IPC | 302 | Whoever commits murder shall be punished with death, or imprisonment for life |

- First point
- Second point
`;

describe("pdf export", () => {
  it("strips emoji and unsupported punctuation", () => {
    const out = toPdfText("Fine ₹5,000 – “quoted” 😀 ok");
    expect(out).toBe('Fine Rs. 5,000 - "quoted" ok');
  });

  it("parses headings, tables and bullets", () => {
    const kinds = parseMarkdown(answer).map((b) => b.kind);
    expect(kinds).toEqual(["heading", "para", "heading", "table", "bullet", "bullet"]);
  });

  it("builds a multi-page pdf for a long answer", () => {
    const long = Array.from({ length: 80 }, (_, i) => `Paragraph ${i} ${"lorem ipsum dolor ".repeat(20)}`).join("\n\n");
    const doc = buildAnswerPdf({
      title: "T",
      query: "q",
      answer: `${answer}\n\n${long}`,
      sections: [{ title: "Arguments For", items: ["a", "b"] }],
      citations: [{ source: "BNS", section: "Section 103", text: "x" }],
      filename: "t.pdf",
    });
    expect(doc).not.toBeNull();
    expect(doc!.getNumberOfPages()).toBeGreaterThan(2);
    expect(doc!.output().length).toBeGreaterThan(1000);
  });

  it("defers Hindi content to the print fallback", () => {
    expect(buildAnswerPdf({ title: "T", answer: "हत्या की सज़ा", filename: "t.pdf" })).toBeNull();
  });
});
