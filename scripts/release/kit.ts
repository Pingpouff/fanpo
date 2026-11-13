import { collectKit, exportKit } from "../../src/release/kit.ts";
const destination = Deno.args[0] ?? "tmp/release/agent-kit";
const files = await collectKit();
for (const [path, content] of Object.entries(files)) {
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (/^(?:https?:|#)/.test(link)) continue;
    const resolved = new URL(link.split("#")[0], `https://kit.invalid/${path}`)
      .pathname.slice(1);
    if (!(resolved in files)) {
      throw new Error(`Broken agent kit link: ${path}: ${link}`);
    }
  }
}
await exportKit(destination, files);
console.log(
  `Exported ${Object.keys(files).length} agent kit files to ${destination}`,
);
