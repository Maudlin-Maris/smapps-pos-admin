// Minimal xlsx-compatible facade backed by exceljs (maintained).
// Replaces the vulnerable `xlsx` package for the small subset of APIs the app uses.
import ExcelJS from "exceljs";

export type Cell = string | number | boolean | null | undefined;
export type Sheet = {
  rows: Cell[][];
  "!cols"?: { wch: number }[];
  _name?: string;
};
export type Workbook = { sheets: Sheet[]; Sheets: Record<string, Sheet>; SheetNames: string[] };

function newWorkbook(): Workbook {
  return { sheets: [], Sheets: {}, SheetNames: [] };
}

export const utils = {
  book_new: newWorkbook,

  aoa_to_sheet: (rows: Cell[][]): Sheet => ({ rows: rows.map((r) => [...r]) }),

  json_to_sheet: (rows: Record<string, unknown>[]): Sheet => {
    if (!rows.length) return { rows: [] };
    const headers = Object.keys(rows[0]);
    const body = rows.map((r) => headers.map((h) => r[h] as Cell));
    return { rows: [headers, ...body] };
  },

  book_append_sheet: (wb: Workbook, ws: Sheet, name: string) => {
    ws._name = name;
    wb.sheets.push(ws);
    wb.Sheets[name] = ws;
    wb.SheetNames.push(name);
  },

  sheet_to_json: <T = Cell[]>(ws: Sheet, _opts?: { header: 1 }): T[] => {
    return ws.rows as unknown as T[];
  },
};

export async function writeFile(wb: Workbook, filename: string): Promise<void> {
  const ewb = new ExcelJS.Workbook();
  for (const s of wb.sheets) {
    const ews = ewb.addWorksheet(s._name || "Sheet1");
    if (s["!cols"]) {
      ews.columns = s["!cols"].map((c) => ({ width: c.wch }));
    }
    for (const row of s.rows) ews.addRow(row);
  }
  const buf = await ewb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function read(data: ArrayBuffer): Promise<Workbook> {
  const ewb = new ExcelJS.Workbook();
  await ewb.xlsx.load(data);
  const wb = newWorkbook();
  ewb.worksheets.forEach((ws) => {
    const rows: Cell[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as unknown[];
      const arr: Cell[] = [];
      // exceljs row.values is 1-indexed; index 0 is empty
      for (let i = 1; i < values.length; i++) {
        const v = values[i];
        if (v == null) {
          arr.push("");
        } else if (typeof v === "object" && "text" in (v as Record<string, unknown>)) {
          arr.push(String((v as { text: unknown }).text ?? ""));
        } else if (typeof v === "object" && "result" in (v as Record<string, unknown>)) {
          arr.push((v as { result: Cell }).result ?? "");
        } else if (v instanceof Date) {
          arr.push(v.toISOString());
        } else {
          arr.push(v as Cell);
        }
      }
      rows.push(arr);
    });
    const sheet: Sheet = { rows, _name: ws.name };
    wb.sheets.push(sheet);
    wb.Sheets[ws.name] = sheet;
    wb.SheetNames.push(ws.name);
  });
  return wb;
}
