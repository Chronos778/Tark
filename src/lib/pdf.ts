/* eslint-disable no-irregular-whitespace, no-control-regex, no-misleading-character-class */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfCitation {
  source?: string;
  section?: string | null;
  text?: string;
  url?: string;
}

export interface PdfSection {
  title: string;
  items: string[];
}

export interface PdfDocInput {
  title: string;
  /** Short line under the title, e.g. date and domain */
  meta?: string;
  query?: string;
  /** Markdown answer from the assistant */
  answer: string;
  sections?: PdfSection[];
  citations?: PdfCitation[];
  /** Keep every line break (letters, drafts) instead of joining lines into paragraphs */
  preserveLines?: boolean;
  filename: string;
}

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}\u{2705}\u{274C}\u{FE0F}\u{200D}]+ ?/gu;
const DEVANAGARI = /[ऀ-ॿ]/;

/** Strip emoji and swap characters the built-in PDF fonts cannot draw. */
export const toPdfText = (text: string) =>
  text
    .replace(EMOJI, "")
    .replace(/₹/g, "Rs. ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—‑]/g, "-")
    .replace(/…/g, "...")
    .replace(/[    ]/g, " ")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF]/g, "");

type Block =
  | { kind: "heading"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "para"; text: string }
  | { kind: "table"; head: string[]; rows: string[][] };

const stripInline = (s: string) =>
  s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => stripInline(c));

const isSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

/** Minimal markdown parser: headings, bullets, tables and paragraphs. */
export const parseMarkdown = (md: string, preserveLines = false): Block[] => {
  const normalized = md.replace(/\|{2,}/g, "|\n|");
  const lines = normalized.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "para", text: stripInline(para.join(" ")) });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      flush();
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--;
      blocks.push({ kind: "table", head, rows });
      continue;
    }
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", text: stripInline(heading[1]) });
      continue;
    }
    const bold = line.match(/^\s*\*\*([^*]+)\*\*\s*:?\s*$/);
    if (bold) {
      flush();
      blocks.push({ kind: "heading", text: bold[1].trim() });
      continue;
    }
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flush();
      blocks.push({ kind: "bullet", text: stripInline(bullet[1]) });
      continue;
    }
    if (preserveLines) {
      flush();
      blocks.push({ kind: "para", text: stripInline(line) });
    } else {
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Devanagari cannot be drawn with jsPDF's built-in fonts, so Hindi content is rendered as a
 * print-ready page where the browser's own fonts handle it ("Save as PDF" in the print dialog).
 */
const htmlParts = (input: PdfDocInput) => {
  const body = parseMarkdown(input.answer, input.preserveLines)
    .map((b) => {
      if (b.kind === "heading") return `<h3>${escapeHtml(b.text)}</h3>`;
      if (b.kind === "bullet") return `<li>${escapeHtml(b.text)}</li>`;
      if (b.kind === "table")
        return `<table><thead><tr>${b.head.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${b.rows
          .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`;
      return `<p>${escapeHtml(b.text)}</p>`;
    })
    .join("\n")
    .replace(/(<li>.*?<\/li>\n?)+/gs, (m) => `<ul>${m}</ul>`);

  const sections = (input.sections ?? [])
    .filter((s) => s.items.length)
    .map((s) => `<h3>${escapeHtml(s.title)}</h3><ul>${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`)
    .join("");
  const cites = (input.citations ?? []).length
    ? `<h3>Legal Citations</h3><ul>${(input.citations ?? [])
        .map((c) => `<li>${escapeHtml([c.source, c.section].filter(Boolean).join(" - "))}</li>`)
        .join("")}</ul>`
    : "";
  return { body, sections, cites };
};

const printAsPdf = (input: PdfDocInput) => {
  const { body, sections, cites } = htmlParts(input);
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups for this site to download the PDF.");
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(input.filename.replace(/\.pdf$/, ""))}</title>
<style>
  body{font-family:"Noto Serif Devanagari","Nirmala UI","Segoe UI",Georgia,serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.6;font-size:14px}
  h1{font-size:22px;margin:0 0 4px} h3{font-size:15px;margin:18px 0 6px} .meta{color:#666;font-size:12px;margin-bottom:16px}
  table{border-collapse:collapse;width:100%;margin:10px 0} th,td{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top;font-size:13px}
  th{background:#f0f0f0} .q{background:#f6f6f6;padding:10px 12px;border-left:3px solid #999;margin:12px 0}
  .disc{margin-top:28px;color:#777;font-size:11px;border-top:1px solid #ddd;padding-top:8px}
</style></head><body>
<h1>${escapeHtml(input.title)}</h1><div class="meta">${escapeHtml(input.meta ?? "")}</div>
${input.query ? `<div class="q"><b>Query:</b> ${escapeHtml(input.query)}</div>` : ""}
${body}${sections}${cites}
<div class="disc">Disclaimer: For informational purposes only. Not legal advice.</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`);
  w.document.close();
};

/**
 * Hindi path: render the content as HTML (the browser shapes Devanagari correctly) and let jsPDF
 * paginate it into a real downloadable PDF. Text is rasterised, so it is not selectable.
 */
export const htmlToPdf = async (input: PdfDocInput): Promise<jsPDF> => {
  const { body, sections, cites } = htmlParts(input);
  const host = document.createElement("div");
  host.style.cssText =
    "position:absolute;left:0;top:0;z-index:-1;width:720px;padding-bottom:16px;background:#fff;color:#111;line-height:1.6;font-size:14px;" +
    "font-family:'Noto Serif Devanagari','Nirmala UI','Segoe UI',Arial,sans-serif";
  host.innerHTML = `<style>
    h1{font-size:22px;margin:0 0 4px} h3{font-size:15px;margin:16px 0 6px} p{margin:0 0 8px} ul{margin:0 0 8px;padding-left:20px}
    .meta{color:#666;font-size:12px;margin-bottom:14px}
    table{border-collapse:collapse;width:100%;margin:8px 0} th,td{border:1px solid #bbb;padding:5px 7px;text-align:left;vertical-align:top;font-size:13px}
    th{background:#eee} .q{background:#f4f4f4;padding:8px 10px;border-left:3px solid #999;margin:10px 0}
    .disc{margin-top:22px;color:#777;font-size:11px;border-top:1px solid #ddd;padding-top:6px}
  </style>
  <h1>${escapeHtml(input.title)}</h1><div class="meta">${escapeHtml(input.meta ?? "")}</div>
  ${input.query ? `<div class="q"><b>Query:</b> ${escapeHtml(input.query)}</div>` : ""}
  ${body}${sections}${cites}
  <div class="disc">Disclaimer: For informational purposes only. Not legal advice.</div>`;
  document.body.appendChild(host);
  try {
    await document.fonts?.ready;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const marginX = 15;
    const marginTop = 15;
    const contentW = 180;
    const mmPerPx = contentW / canvas.width;
    const pagePx = Math.floor((297 - marginTop - 18) / mmPerPx);
    const isBlankRow = (y: number) => {
      const px = ctx.getImageData(0, y, canvas.width, 1).data;
      for (let i = 0; i < px.length; i += 4) if (px[i] < 245 || px[i + 1] < 245 || px[i + 2] < 245) return false;
      return true;
    };

    // Cut the tall image into A4 pages, preferring a blank row so text lines are not sliced
    let top = 0;
    let first = true;
    while (top < canvas.height) {
      let end = Math.min(top + pagePx, canvas.height);
      if (end < canvas.height) {
        for (let y = end; y > end - 90 && y > top + 60; y--) {
          if (isBlankRow(y)) {
            end = y;
            break;
          }
        }
      }
      const height = end - top;
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = height;
      slice.getContext("2d")?.drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
      if (!first) doc.addPage();
      first = false;
      doc.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", marginX, marginTop, contentW, height * mmPerPx);
      top = end;
    }
    return doc;
  } finally {
    host.remove();
  }
};

/** Build a paginated PDF of an assistant answer. Returns null when the content needs the HTML path. */
export const buildAnswerPdf = (input: PdfDocInput): jsPDF | null => {
  const all = [input.answer, input.query, ...(input.sections ?? []).flatMap((s) => s.items)].join(" ");
  if (DEVANAGARI.test(all)) return null;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15;
  const W = 210 - M * 2;
  const bottom = 297 - 20;
  let y = 20;

  const ensure = (h: number) => {
    if (y + h > bottom) {
      doc.addPage();
      y = 20;
    }
  };
  const write = (text: string, size: number, color: [number, number, number], style: "normal" | "bold" = "normal", indent = 0, gap = 1.6) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lineH = size * 0.5;
    const lines = doc.splitTextToSize(toPdfText(text), W - indent) as string[];
    for (const line of lines) {
      ensure(lineH);
      doc.text(line, M + indent, y);
      y += lineH;
    }
    y += gap;
  };

  write(input.title, 20, [30, 30, 30], "bold", 0, 1);
  if (input.meta) write(input.meta, 9, [110, 110, 110], "normal", 0, 3);
  doc.setDrawColor(210, 210, 210);
  doc.line(M, y - 1, M + W, y - 1);
  y += 4;

  if (input.query) {
    write("Query", 9, [110, 110, 110], "bold", 0, 0.5);
    write(input.query, 12, [0, 0, 0], "normal", 0, 4);
  }

  for (const b of parseMarkdown(input.answer, input.preserveLines)) {
    if (b.kind === "heading") {
      y += 1.5;
      ensure(10);
      write(b.text, 12, [30, 30, 30], "bold", 0, 1);
    } else if (b.kind === "bullet") {
      ensure(6);
      const startY = y;
      write(b.text, 10.5, [20, 20, 20], "normal", 5, 1);
      doc.setFontSize(10.5);
      doc.text("-", M + 1.5, startY);
    } else if (b.kind === "table") {
      ensure(20);
      autoTable(doc, {
        startY: y,
        head: [b.head.map(toPdfText)],
        body: b.rows.map((r) => r.map(toPdfText)),
        theme: "grid",
        margin: { left: M, right: M },
        styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [60, 60, 60] },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    } else {
      write(b.text, 10.5, [20, 20, 20], "normal", 0, 2.5);
    }
  }

  for (const s of input.sections ?? []) {
    if (!s.items.length) continue;
    y += 1.5;
    ensure(10);
    write(s.title, 12, [30, 30, 30], "bold", 0, 1);
    for (const item of s.items) {
      const startY = y;
      write(item, 10.5, [20, 20, 20], "normal", 5, 1);
      doc.setFontSize(10.5);
      doc.text("-", M + 1.5, startY);
    }
  }

  if (input.citations?.length) {
    y += 3;
    ensure(30);
    write("Legal Citations", 12, [30, 30, 30], "bold", 0, 2);
    autoTable(doc, {
      startY: y,
      head: [["Source", "Section", "Excerpt"]],
      body: input.citations.map((c) => [
        toPdfText(c.source ?? ""),
        toPdfText(c.section ?? ""),
        toPdfText((c.text ?? "").slice(0, 220)),
      ]),
      theme: "grid",
      margin: { left: M, right: M },
      styles: { fontSize: 8.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [60, 60, 60] },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 30 } },
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Disclaimer: For informational purposes only. Not legal advice.", M, 290);
    doc.text(`Page ${p} of ${pages}`, 210 - M, 290, { align: "right" });
  }

  return doc;
};

/** Download the PDF; Hindi content opens a print-ready page instead (jsPDF cannot draw Devanagari). */
export const downloadAnswerPdf = async (input: PdfDocInput): Promise<void> => {
  const doc = buildAnswerPdf(input);
  if (doc) {
    doc.save(input.filename);
    return;
  }
  try {
    (await htmlToPdf(input)).save(input.filename);
  } catch (error) {
    console.error("HTML PDF failed, falling back to the print dialog:", error);
    printAsPdf(input);
  }
};
