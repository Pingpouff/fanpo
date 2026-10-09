import { FantasyClient, FantasyHttpError } from "../src/client.ts";
import { assert, equal, rejects } from "./helpers.ts";
import { sheetResponse } from "./fixtures.ts";

Deno.test("multiple fiches fetch concurrently with at most five requests and preserve input order", async () => {
  let active = 0;
  let peak = 0;
  const pending: (() => void)[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) => {
      active++;
      peak = Math.max(peak, active);
      const id = Number(url.pathname.split("/")[3]);
      return new Promise<Response>((resolve) => {
        pending.push(() => {
          active--;
          resolve(
            Response.json({
              ...sheetResponse,
              joueur: { ...sheetResponse.joueur, id },
            }),
          );
        });
      });
    },
  });
  const ids = [9, 3, 7, 2, 8, 1, 4, 3];
  const result = client.getPlayerSheets(ids);
  // Complete each wave in reverse order, without relying on timers.
  while (pending.length || active) {
    pending.splice(0).reverse().forEach((resolve) => resolve());
    for (let i = 0; i < 20; i++) await Promise.resolve();
  }
  equal((await result).map((s) => s.joueur.id), ids);
  equal(peak, 5);
});

Deno.test("multiple fiches validate the entire input before making requests", async () => {
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
    await rejects(
      async () => await client.getPlayerSheets([825, id]),
      "positive safe integer",
    );
  }
  equal(await client.getPlayerSheets([]), []);
  equal(calls, 0);
});

Deno.test("multiple fiches report the failed player endpoint and preserve HTTP error status", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) =>
      Promise.resolve(
        url.pathname.includes("/826/")
          ? new Response("private body", { status: 404 })
          : Response.json(sheetResponse),
      ),
  });
  const error = await rejects(
    () => client.getPlayerSheets([825, 826]),
    "/api/joueurs/826/fiche",
  );
  assert(error instanceof FantasyHttpError);
  equal(error.status, 404);
  assert(!error.message.includes("private body"));
});

Deno.test("failed batches stop queued requests and drain in-flight fiches before rejecting", async () => {
  const requested: number[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: async (url) => {
      const id = Number(url.pathname.split("/")[3]);
      requested.push(id);
      if (id === 1) return new Response(null, { status: 404 });
      await gate;
      return Response.json(sheetResponse);
    },
  });
  let settled = false;
  const result = rejects(
    () => client.getPlayerSheets([1, 2, 3, 4, 5, 6, 7]),
    "/api/joueurs/1/fiche",
  ).then(() => {
    settled = true;
  });
  // Allow the failing response to propagate while other requests remain gated.
  for (let i = 0; i < 20; i++) await Promise.resolve();
  const settledBeforeRelease = settled;
  release();
  await result;
  equal(settledBeforeRelease, false);
  equal(requested, [1, 2, 3, 4, 5]);
});
