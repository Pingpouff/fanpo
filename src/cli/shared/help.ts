/** Group Cliffy's generated command rows, retaining its argument syntax and descriptions. */
export function groupRootHelp(help: string): string {
  const groups = [
    {
      title: "API (live data)",
      names: [
        "players",
        "player",
        "composition",
        "round",
        "teamsheets",
        "locks",
        "ratings",
        "top14",
        "competition",
        "games",
      ],
    },
    { title: "Data (local cache)", names: ["sync", "data"] },
    { title: "Analysis (projections)", names: ["analyze", "compare"] },
  ];
  return help.replace(
    /(\nCommands:\n)([\s\S]*?)(?=\n\S[^\n]*:\n|$)/,
    (_match, heading: string, body: string) => {
      const rows: { name: string; lines: string[] }[] = [];
      for (const line of body.split("\n")) {
        if (!line.trim()) continue;
        const name = line.match(/^ {2}(\S+)/)?.[1];
        if (name) rows.push({ name, lines: [line.trimEnd()] });
        else rows.at(-1)?.lines.push(line.trimEnd());
      }
      const classified = new Set(groups.flatMap((g) => g.names));
      const sections = groups.map((g) => ({
        title: g.title,
        rows: g.names.flatMap((name) => rows.filter((r) => r.name === name)),
      }));
      const other = rows.filter((r) => !classified.has(r.name));
      if (other.length) sections.push({ title: "Other", rows: other });
      return heading + "\n" +
        sections.filter((s) => s.rows.length).map((s) =>
          `  ${s.title}:\n\n${
            s.rows.flatMap((r) => r.lines.map((line) => `  ${line}`)).join("\n")
          }`
        ).join("\n\n") + "\n";
    },
  );
}
