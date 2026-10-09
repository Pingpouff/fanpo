import { heading, stripAnsi, tone } from "./colors.ts";
export interface OutputOptions {
  json?: boolean;
  detailed?: boolean;
}

export function renderTable(
  input: string[][],
  options: { header?: boolean } = {},
): string {
  const rows = input.map((row) => row.map((cell) => cell.replace(/\s+/g, " ")));
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((row) => stripAnsi(row[i]).length))
  );
  return rows.map((row, index) =>
    row.map((cell, i) =>
      (index === 0 && options.header !== false
        ? heading(cell)
        : ["-", "Unknown", "Unresolved"].includes(cell)
        ? tone(cell, "muted")
        : cell) +
      " ".repeat(widths[i] - stripAnsi(cell).length)
    ).join("  ").trimEnd()
  )
    .join("\n");
}
