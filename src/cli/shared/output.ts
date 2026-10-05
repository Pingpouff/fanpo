export interface OutputOptions {
  json?: boolean;
  detailed?: boolean;
}

export function renderTable(input: string[][]): string {
  const rows = input.map((row) => row.map((cell) => cell.replace(/\s+/g, " ")));
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((row) => row[i].length))
  );
  return rows.map((row) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd()
  )
    .join("\n");
}
