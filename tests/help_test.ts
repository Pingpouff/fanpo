import { runCli } from "../src/cli.ts";
import { assert, equal } from "./helpers.ts";
Deno.test("root help explains output, setup, salary cap discovery and detailed help", async () => {
  const text = await runCli(["--help"]);
  for (
    const s of ["--json", "composition", "salary cap", "sqlite:setup", "--help"]
  ) assert(text.includes(s), `Missing ${s}`);
});
Deno.test("every leaf help has a useful description and an executable example without credentials", async () => {
  for (
    const args of [
      ["players"],
      ["player"],
      ["composition"],
      ["round"],
      ["teamsheets"],
      ["locks"],
      ["ratings"],
      ["top14", "standings"],
      ["top14", "matches"],
      ["sync"],
      ["data", "status"],
      ["data", "players"],
      ["analyze", "player"],
      ["analyze", "matchups"],
      ["analyze", "lineup"],
      ["compare"],
    ]
  ) {
    const text = await runCli([...args, "--help"]);
    assert(
      text.includes("Description:"),
      `Missing description: ${args.join(" ")}`,
    );
    assert(text.includes("Examples:"), `Missing examples: ${args.join(" ")}`);
    assert(text.includes(`deno task cli ${args.join(" ")}`));
  }
});
Deno.test("composition help distinguishes effective and reference salary caps", async () => {
  const text = await runCli(["composition", "--help"]);
  for (
    const s of ["equipe.budget", "reference", "salary cap", "--round", "--json"]
  ) assert(text.includes(s), `Missing ${s}`);
});
Deno.test("group commands return their help instead of writing it directly", async () => {
  for (const args of [["analyze"], ["data"], ["top14"]]) {
    equal(await runCli(args), await runCli([...args, "--help"]));
  }
});
Deno.test("analysis help explains uncertainty and how to create lineup files", async () => {
  const player = await runCli(["analyze", "player", "--help"]);
  assert(player.includes("Unresolved"));
  assert(player.includes("--offline"));
  const compare = await runCli(["compare", "--help"]);
  for (const s of ["--alternative", "captainSlot", "1-based", "--lineup"]) {
    assert(compare.includes(s), `Missing ${s}`);
  }
});

Deno.test("root help advertises ratings with English terminology", async () => {
  const help = await runCli(["--help"]);
  assert(/\n\s+ratings\s+-/.test(help));
  assert(!/\n\s+notes\s+-/.test(help));
});

Deno.test("root help groups existing commands into API, Data and Analysis sections", async () => {
  const text = await runCli(["--help"]);
  const api = text.indexOf("API (live data):");
  const data = text.indexOf("Data (local cache):");
  const analysis = text.indexOf("Analysis (projections):");
  assert(api >= 0 && data > api && analysis > data);
  const sections = [
    text.slice(api, data),
    text.slice(data, analysis),
    text.slice(analysis, text.indexOf("Examples:")),
  ];
  for (
    const [i, names] of [
      [
        "players",
        "player",
        "composition",
        "round",
        "teamsheets",
        "locks",
        "ratings",
        "top14",
      ],
      ["sync", "data"],
      ["analyze", "compare"],
    ].entries()
  ) {
    for (const name of names) {
      const pattern = new RegExp(`^\\s+${name}\\s+`, "gm");
      equal([...sections[i].matchAll(pattern)].length, 1);
    }
  }
  equal(await runCli([]), text);
  const leaf = await runCli(["analyze", "player", "--help"]);
  assert(!leaf.includes("API (live data):"));
  assert(leaf.includes("--offline"));
});
