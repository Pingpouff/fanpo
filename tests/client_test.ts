import { FantasyClient, FantasyHttpError } from "../src/client.ts";
import { assert, equal, rejects, throws } from "./helpers.ts";
import { response, sheetResponse } from "./fixtures.ts";

Deno.test("client sends the endpoint and headers and preserves additional fields", async () => {
  let calls = 0;
  const fakeFetch = (input: URL, init: RequestInit) => {
    calls++;
    equal(String(input), "https://example.test/api/joueurs");
    const headers = new Headers(init?.headers);
    equal(headers.get("authorization"), "Bearer test-token");
    equal(headers.get("accept"), "application/json");
    equal(init?.method, "GET");
    equal(init?.redirect, "error");
    return Promise.resolve(Response.json(response));
  };
  const client = new FantasyClient({
    baseUrl: "https://example.test/",
    token: "test-token",
    fetch: fakeFetch,
  });
  equal(await client.getPlayers(), response);
  equal(calls, 1);
});

Deno.test("client reports non-2xx status without including the response body or token", async () => {
  for (const status of [401, 403, 429, 500]) {
    const client = new FantasyClient({
      baseUrl: "https://example.test",
      token: "secret-test-token",
      fetch: () =>
        Promise.resolve(new Response("secret-test-token", { status })),
    });
    try {
      await client.getPlayers();
      throw new Error("Expected HTTP failure");
    } catch (error) {
      assert(error instanceof FantasyHttpError);
      equal(error.status, status);
      assert(error.message.includes(String(status)));
      assert(error.message.includes("/api/joueurs"));
      assert(!error.message.includes("secret-test-token"));
    }
  }
});

Deno.test("client gives a clear error for malformed JSON", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(new Response("not JSON")),
  });
  await rejects(() => client.getPlayers(), "JSON");
});

Deno.test("client gives a clear error for a failed network request", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.reject(new TypeError("Network unavailable")),
  });
  await rejects(() => client.getPlayers(), "request failed");
});

Deno.test("client rejects empty tokens and invalid base URLs before fetching", () => {
  throws(
    () => new FantasyClient({ baseUrl: "https://example.test", token: " " }),
    "token",
  );
  for (
    const baseUrl of [
      "",
      "invalid",
      "file:///tmp/data",
      "https://user:pass@example.test",
    ]
  ) {
    throws(
      () => new FantasyClient({ baseUrl, token: "test-token" }),
      "base URL",
    );
  }
});

Deno.test("player sheet uses the ID endpoint and shared authentication and preserves stats", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url, init) => {
      equal(url.href, "https://example.test/api/joueurs/825/fiche");
      const headers = new Headers(init.headers);
      equal(headers.get("authorization"), "Bearer test-token");
      equal(headers.get("accept"), "application/json");
      equal(init.method, "GET");
      return Promise.resolve(Response.json(sheetResponse));
    },
  });
  const sheet = await client.getPlayerSheet(825);
  equal(sheet, sheetResponse);
  const evolvingStat: number = sheet.perfs[0].stats.future_numeric_stat;
  equal(evolvingStat, 12.5);
  equal(sheet.perfs[0].stats.tackles, 17);
});

Deno.test("player sheet propagates missing-player and other HTTP statuses", async () => {
  for (const status of [404, 401, 500]) {
    const client = new FantasyClient({
      baseUrl: "https://example.test",
      token: "test-token",
      fetch: () => Promise.resolve(new Response("private body", { status })),
    });
    const error = await rejects(
      () => client.getPlayerSheet(825),
      `HTTP ${status}`,
    );
    assert(error instanceof FantasyHttpError);
    equal(error.status, status);
    assert(error.message.includes("/api/joueurs/825/fiche"));
    assert(!error.message.includes("private body"));
  }
});

Deno.test("player sheet rejects invalid IDs before fetching", () => {
  let calls = 0;
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => {
      calls++;
      return Promise.resolve(Response.json(sheetResponse));
    },
  });
  for (const id of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    throws(() => client.getPlayerSheet(id), "positive safe integer");
  }
  equal(calls, 0);
});
