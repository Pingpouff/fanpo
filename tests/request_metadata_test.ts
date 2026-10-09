import { FantasyClient } from "../src/client.ts";
import { runCli } from "../src/cli.ts";
import { assert, equal, rejects } from "./helpers.ts";
import { response } from "./fixtures.ts";
import type { RequestMetadata } from "../src/api/http.ts";
import type { CommandMetadata } from "../src/cli/shared/metadata.ts";
Deno.test("HTTP metadata measures UTF-8 bytes and duration without changing API responses or exposing credentials", async () => {
  const body = JSON.stringify({ ...response, label: "Équipe 🏉" });
  const events: RequestMetadata[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "secret-token",
    fetch: async () => {
      await new Promise((r) => setTimeout(r, 3));
      return new Response(body);
    },
  });
  const stop = client.observeRequests((e) => events.push(e));
  equal(await client.getPlayers(), JSON.parse(body));
  equal(events.length, 1);
  equal(events[0].responseBytes, new TextEncoder().encode(body).length);
  equal(events[0].status, 200);
  equal(events[0].outcome, "success");
  assert(events[0].durationMs >= 0);
  assert(Number.isFinite(Date.parse(events[0].startedAt)));
  assert(!JSON.stringify(events).includes("secret-token"));
  stop();
  await client.getPlayers();
  equal(events.length, 1);
});
Deno.test("HTTP metadata reports network, HTTP and malformed JSON failures", async () => {
  for (
    const [fetch, outcome, status] of [
      [() => Promise.reject(new Error("network")), "network-error", null],
      [
        () => Promise.resolve(new Response("secret-token", { status: 403 })),
        "http-error",
        403,
      ],
      [() => Promise.resolve(new Response("invalid")), "invalid-json", 200],
    ] as const
  ) {
    const client = new FantasyClient({
      baseUrl: "https://example.com",
      token: "secret-token",
      fetch,
    });
    const events: RequestMetadata[] = [];
    client.observeRequests((e) => events.push(e));
    await rejects(() => client.getPlayers(), "Fantasy API");
    equal(events[0].outcome, outcome);
    equal(events[0].status, status);
    assert(!JSON.stringify(events).includes("secret-token"));
  }
});
Deno.test("CLI debug output includes each request; normal and JSON output stay compatible", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: () => Promise.resolve(Response.json(response)),
  });
  const metadata: CommandMetadata[] = [];
  const plain = await runCli(["players"], client, (m) => metadata.push(m));
  assert(!plain.includes("Request metadata"));
  equal(metadata.length, 0);
  const human = await runCli(
    ["players", "--debug"],
    client,
    (m) => metadata.push(m),
  );
  assert(human.includes("Request metadata"));
  assert(human.includes("/api/joueurs"));
  assert(human.includes("Not stored"));
  equal(metadata[0].requests.length, 1);
  assert(metadata[0].totalResponseBytes > 0);
  const json = await runCli(
    ["players", "--json", "--debug"],
    client,
    (m) => metadata.push(m),
  );
  equal(JSON.parse(json).data, response);
  equal(JSON.parse(json).metadata, metadata[1]);
  equal(metadata[1].requests.length, 1);
  const help = await runCli(["--help"], client, (m) => metadata.push(m));
  assert(!help.includes("Request metadata"));
  equal(metadata.length, 2);
  await runCli(["players", "--debug"], client, (m) => metadata.push(m));
  equal(metadata[2].requests.length, 1);
});
Deno.test("debug metadata covers every batched player request and failures and detaches after errors", async () => {
  const { sheetResponse } = await import("./fixtures.ts");
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (url) =>
      Promise.resolve(
        Response.json({
          ...sheetResponse,
          joueur: {
            ...sheetResponse.joueur,
            id: Number(url.pathname.split("/")[3]),
          },
        }),
      ),
  });
  const text = JSON.parse(
    await runCli(["player", "825", "479", "--json", "--debug"], client),
  );
  equal(text.data.length, 2);
  equal(text.metadata.requestCount, 2);
  equal(text.metadata.requests.length, 2);
  for (const r of text.metadata.requests) {
    equal(r.storage, "not-stored");
    equal(r.storedBytes, 0);
  }
  const failure = new FantasyClient({
    baseUrl: "https://example.com",
    token: "secret-token",
    fetch: () => Promise.resolve(new Response("secret-token", { status: 503 })),
  });
  const events: CommandMetadata[] = [];
  await rejects(
    () => runCli(["players", "--debug"], failure, (m) => events.push(m)),
    "503",
  );
  equal(events[0].requests[0].outcome, "http-error");
  assert(!JSON.stringify(events).includes("secret-token"));
  await rejects(() => runCli(["players"], failure), "503");
  equal(events[0].requests.length, 1);
});
Deno.test("observer errors cannot alter API results and debug is supported before the command", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: () => Promise.resolve(Response.json(response)),
  });
  const stop = client.observeRequests(() => {
    throw new Error("Observer failed");
  });
  equal(await client.getPlayers(), response);
  stop();
  const text = await runCli(["--debug", "players", "--json"], client);
  equal(JSON.parse(text).data, response);
  equal(JSON.parse(text).metadata.requestCount, 1);
});
