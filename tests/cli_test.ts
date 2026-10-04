import { runCli } from "../src/cli.ts";
import { FantasyClient } from "../src/client.ts";
import type { PlayersResponse } from "../src/types.ts";
import { assert, equal, rejects } from "./helpers.ts";
import { response } from "./fixtures.ts";

function client(payload = response): FantasyClient {
  return new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(Response.json(payload)),
  });
}

Deno.test("CLI JSON preserves the response envelope and filters only players", async () => {
  const output: PlayersResponse = JSON.parse(
    await runCli(
      ["players", "--json", "--club", "ubb", "--available"],
      client(),
    ),
  );
  equal(output.joueurs.map((p) => p.id), [1]);
  equal(output.journee, response.journee);
  equal(output.additional_response_field, "preserved");
  equal(output.joueurs[0].additional_player_field, { score: 5 });
});

Deno.test("CLI table displays players, values and unavailable status", async () => {
  const output = await runCli(["players"], client());
  for (
    const text of [
      "NAME",
      "CLUB",
      "POSITION",
      "VALUE",
      "AVERAGE",
      "AVAILABLE",
      "Demba Bamba",
      "Alex Martin",
      "12.50",
      "yes",
      "no",
    ]
  ) {
    assert(output.includes(text), `Missing ${text}`);
  }
});

Deno.test("CLI applies name and position filters together", async () => {
  const output = await runCli([
    "players",
    "--position",
    "pil",
    "--name",
    "bamba",
  ], client());
  assert(output.includes("Demba Bamba"));
  assert(!output.includes("Alex Martin"));
});

Deno.test("CLI handles empty results in both output modes", async () => {
  equal(
    await runCli(["players", "--name", "unknown"], client()),
    "No players found.",
  );
  const output = JSON.parse(
    await runCli(["players", "--json", "--name", "unknown"], client()),
  );
  equal(output.joueurs, []);
});

Deno.test("CLI help works without environment or network permissions", async () => {
  for (const args of [[], ["--help"], ["-h"], ["players", "--help"]]) {
    assert((await runCli(args)).includes("players"));
  }
});

Deno.test("CLI rejects unknown commands, options and missing filter values before fetching", async () => {
  for (
    const [args, message] of [
      [["teams"], "Unknown command"],
      [["players", "--unknown"], "Unknown option"],
      [["players", "extra"], "Unknown option"],
      [["players", "--club"], "requires a value"],
      [["players", "--name", "--json"], "requires a value"],
      [["players", "--position", "  "], "requires a value"],
    ] as const
  ) {
    await rejects(() => runCli([...args]), message);
  }
});

Deno.test("CLI propagates HTTP errors instead of producing JSON", async () => {
  const failingClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(new Response(null, { status: 401 })),
  });
  await rejects(() => runCli(["players", "--json"], failingClient), "HTTP 401");
});
