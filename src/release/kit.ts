import { VERSION } from "./version.ts";

export const SKILLS = [
  "fantasy-rugby",
  "auditing-fantasy-lineup",
  "analyzing-fantasy-player",
  "analyzing-rugby-matchups",
  "optimizing-fantasy-lineup",
  "selecting-fantasy-captain",
  "selecting-impact-players",
  "validating-fantasy-lineup",
];
export const KIT_SOURCES = [
  ...SKILLS.map((name) => `.agents/skills/${name}/SKILL.md`),
  "regles_fantasy_rugby.md",
  "docs/fantasy-advice-workflow.md",
  "docs/cli.md",
  "docs/analysis.md",
  "docs/releases.md",
  "docs/getting-started.md",
  "docs/agents.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  ".agents/skills/LICENSE.denoland",
  "licenses/runtime.txt",
];

export async function collectKit(
  read: (path: string) => Promise<string> = (path) =>
    Deno.readTextFile(new URL(`../../${path}`, import.meta.url)),
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const path of KIT_SOURCES) {
    const text = (await read(path)).replaceAll("\r\n", "\n");
    files[path] = text.replaceAll("deno task cli", "fanpo")
      .replaceAll("README.md#quick-start-from-source", "README.md");
  }
  files["AGENTS.md"] =
    `# Fanpo agent kit\n\nVersion: ${VERSION}\n\nFanpo is a CLI-first tool for people and agents. Run fanpo --help.\nRead .agents/skills/fantasy-rugby/SKILL.md, regles_fantasy_rugby.md and\ndocs/fantasy-advice-workflow.md before advising on a lineup.\nUse --json; keep competition, profile, season and database consistent.\nDefault Top 14; use --nationchampionship consistently for internationals.\nAudit first, compare complete proposals, validate the final lineup.\nRespect warnings and PROVISIONAL results. Never reproduce scoring in SQL\nor scratch scripts. Never print credentials or change the live team.\n\nThe skills require Fanpo ${VERSION}. Configure FANTASY_TOKEN outside prompts.\nThe executable stores facts in the per-user application data directory.\nYou may save proposal JSON files in a local .data/ directory.\nAutomatic skill discovery depends on the agent: ask it to read this file\nand the relevant SKILL.md files, or copy the skill directories into its\nsupported skill location together with their required references.\n`;
  const tokenSection = files["docs/getting-started.md"].match(
    /## Get your token\n[\s\S]*?(?=\n## )/,
  )?.[0].split("The optional `FANTASY_API_URL`")[0]
    .replace(
      "in `.env`",
      "in your per-user configuration file (see [configuration](releases.md#configure-once))",
    );
  if (!tokenSection) throw new Error("Token setup reference missing");
  files["docs/getting-started.md"] =
    `# Getting started\n\nSee [standalone installation and configuration](releases.md).\n\n${tokenSection}`;
  files["README.md"] = files["AGENTS.md"] +
    "\n[Installation and configuration](docs/releases.md) · [CLI reference](docs/cli.md)\n";
  // Fail packaging when a required local reference was omitted.
  const available = new Set([...Object.keys(files), "manifest.json"]);
  for (const [path, content] of Object.entries(files)) {
    files[path] = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (full, label, link) => {
        if (/^(?:https?:|#)/.test(link)) return full;
        const resolved = new URL(
          link.split("#")[0],
          `https://kit.invalid/${path}`,
        ).pathname.slice(1);
        if (available.has(resolved)) return full;
        throw new Error(
          `Missing agent kit reference: ${path}: ${label}: ${link}`,
        );
      },
    );
  }
  files["manifest.json"] = JSON.stringify(
    { version: VERSION, skills: SKILLS, files: Object.keys(files).sort() },
    null,
    2,
  ) + "\n";
  return files;
}

/** Publish a complete kit; never overwrite a user destination or follow its links. */
export async function exportKit(
  destination: string,
  files: Record<string, string>,
): Promise<void> {
  for (const path of Object.keys(files)) {
    if (
      path.startsWith("/") || path.includes("\\") ||
      path.split("/").some((p) => p === ".." || p === "." || !p)
    ) throw new Error("Unsafe agent kit path");
  }
  try {
    await Deno.lstat(destination);
    throw new Error("Agent kit destination already exists");
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  // mkdir without recursive is also the atomic no-overwrite reservation.
  await Deno.mkdir(destination);
  try {
    for (const [path, content] of Object.entries(files)) {
      const parent = path.slice(0, path.lastIndexOf("/"));
      if (path.includes("/")) {
        await Deno.mkdir(`${destination}/${parent}`, { recursive: true });
      }
      await Deno.writeTextFile(`${destination}/${path}`, content, {
        createNew: true,
      });
    }
  } catch (error) {
    await Deno.remove(destination, { recursive: true });
    throw error;
  }
}
