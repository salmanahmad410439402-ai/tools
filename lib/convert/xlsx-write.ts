/**
 * XLSX output for the PDF → Excel tool.
 *
 * SheetJS already ships in this project (it reads .xlsx for CSV → PDF), so it
 * does the workbook serialisation: real cells with types, frozen header rows
 * and column widths that follow the content. It is imported dynamically so a
 * page that never exports a spreadsheet never downloads it.
 */

export interface WorkbookSheet {
  name: string;
  rows: (string | number)[][];
  /** Treat the first row as a header: bold, frozen and filterable. */
  header?: boolean;
}

/** Excel rejects these characters in sheet names, and 31 is the hard limit. */
export function safeSheetName(name: string, used: Set<string>): string {
  const base =
    name
      .replace(/[[\]:*?/\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 31) || "Sheet";
  let candidate = base;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${counter})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function buildXlsx(sheets: WorkbookSheet[], documentTitle: string): Promise<Uint8Array> {
  if (!sheets.length) throw new Error("There was nothing to put in a spreadsheet.");
  const XLSX = await import("xlsx");

  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();

  for (const sheet of sheets) {
    const rows = sheet.rows.length ? sheet.rows : [[""]];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const columns = Math.max(...rows.map((row) => row.length), 1);
    worksheet["!cols"] = Array.from({ length: columns }, (_, index) => {
      const longest = rows.reduce((max, row) => {
        const value = row[index];
        return Math.max(max, value === undefined || value === null ? 0 : String(value).length);
      }, 6);
      return { wch: Math.min(60, Math.max(9, longest + 2)) };
    });
    if (sheet.header !== false && rows.length > 1) {
      worksheet["!freeze"] = { xSplit: "0", ySplit: "1" };
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheet.name, used));
  }

  if (documentTitle) workbook.Props = { Title: documentTitle, Author: "Filecraft" };

  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true }) as ArrayBuffer;
  return new Uint8Array(output);
}
