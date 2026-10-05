import { FantasyClient, FantasyHttpError } from "../src/client.ts";
import type {
  CompositionResponse,
  HistoricalCompositionResponse,
} from "../src/types.ts";
import {
  currentComposition,
  historicalComposition,
} from "./composition_fixtures.ts";
import { assert, equal, rejects, throws } from "./helpers.ts";

Deno.test("current composition uses the current endpoint and shared headers", async () => {
  const payload = currentComposition;
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url, init) => {
      equal(url.pathname, "/api/compos/2");
      const headers = new Headers(init.headers);
      equal(headers.get("authorization"), "Bearer test-token");
      equal(headers.get("accept"), "application/json");
      return Promise.resolve(Response.json(payload));
    },
  });
  const response: CompositionResponse = await client.getComposition(2);
  equal(response, payload);
});

Deno.test("current composition rejects invalid IDs before fetching", () => {
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => {
      throw new Error("Unexpected fetch");
    },
  });
  for (const id of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    throws(() => client.getComposition(id), "ID");
  }
});

Deno.test("historical composition uses the round endpoint and shared request headers", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.test/",
    token: "test-token",
    fetch: (url, init) => {
      equal(url.href, "https://example.test/api/compos/1/journee/4");
      equal(init.method, "GET");
      equal(init.redirect, "error");
      const headers = new Headers(init.headers);
      equal(headers.get("authorization"), "Bearer test-token");
      equal(headers.get("accept"), "application/json");
      return Promise.resolve(Response.json(historicalComposition));
    },
  });
  const result: HistoricalCompositionResponse = await client
    .getCompositionForRound(1, 4);
  equal(result, historicalComposition);
  equal(result.compo.slots.length, 17);
  equal(result.compo.slots.map((slot) => slot.slot), [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
  ]);
  equal(result.compo.points, "1322.47");
  equal(result.compo.capitaine_slot, 13);
  equal(result.compo.capitaine_auto, true);
  equal(result.compo.impact_slot, 17);
  const captain = result.compo.slots[12];
  equal([
    captain.note,
    captain.points,
    captain.minutes,
    captain.titulaire,
    captain.delta_valeur,
  ], [70.15, 140.3, 66, true, 0.02]);
  const impact = result.compo.slots[16];
  equal([impact.note, impact.points, impact.minutes, impact.titulaire], [
    61.89,
    123.78,
    15,
    false,
  ]);
  equal(result.compo.slots[2].forfait, true);
  equal(result.compo.slots[1].delta_valeur, -0.03);
  equal(result.compo.slots[3].note, null);
});

Deno.test("historical composition preserves unusual API points without applying scoring rules", async () => {
  const payload: HistoricalCompositionResponse = {
    ...historicalComposition,
    compo: {
      ...historicalComposition.compo,
      points: null,
      slots: [{ ...historicalComposition.compo.slots[12], points: 123.45 }],
    },
  };
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(Response.json(payload)),
  });
  const result = await client.getCompositionForRound(1, 4);
  equal(result.compo.points, null);
  equal(result.compo.slots[0].points, 123.45);
});

Deno.test("historical composition propagates non-2xx responses", async () => {
  for (const status of [401, 404, 500]) {
    const client = new FantasyClient({
      baseUrl: "https://example.test",
      token: "test-token",
      fetch: () => Promise.resolve(new Response("private body", { status })),
    });
    const error = await rejects(
      () => client.getCompositionForRound(1, 4),
      `HTTP ${status}`,
    );
    assert(error instanceof FantasyHttpError);
    equal(error.status, status);
    assert(error.message.includes("/api/compos/1/journee/4"));
    assert(!error.message.includes("private body"));
  }
});

Deno.test("historical composition rejects invalid resource IDs and round numbers before fetching", () => {
  let calls = 0;
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => {
      calls++;
      return Promise.resolve(Response.json(historicalComposition));
    },
  });
  for (
    const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]
  ) {
    throws(() => client.getCompositionForRound(value, 4), "ID");
    throws(() => client.getCompositionForRound(1, value), "round");
  }
  equal(calls, 0);
});
