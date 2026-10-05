import { ValidationError } from "@cliffy/command";
import { runCli } from "../src/cli.ts";
import { FantasyClient, FantasyHttpError } from "../src/client.ts";
import type { HistoricalCompositionResponse } from "../src/types.ts";
import {
  currentComposition,
  historicalComposition,
} from "./composition_fixtures.ts";
import { assert, equal, rejects } from "./helpers.ts";

function client(payload = historicalComposition): FantasyClient {
  return new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) => {
      equal(url.pathname, "/api/compos/1/journee/4");
      return Promise.resolve(Response.json(payload));
    },
  });
}

Deno.test("composition CLI JSON preserves the complete response and all slots", async () => {
  const output: HistoricalCompositionResponse = JSON.parse(
    await runCli(["composition", "1", "--round", "4", "--json"], client()),
  );
  equal(output, historicalComposition);
  equal(output.compo.slots.length, 17);
  equal(output.compo.slots[12].points, 140.3);
  equal(output.compo.slots[16].points, 123.78);
});

Deno.test("composition CLI displays API totals, captain, impact, real substitutes and forfaits", async () => {
  const output = await runCli(["composition", "1", "--round", "4"], client());
  for (
    const text of [
      "Round 4",
      "2026-09-26T12:30:00.000Z",
      "Status: validee",
      "Total points: 1322.47",
      "Leo Ametlla",
      "Santiago Chocobares",
      "Jiuta Wainiqolo",
      "Paid",
      "Min",
      "Score",
      "Points",
      "70.15",
      "140.30",
      "123.78",
      "[C-auto]",
      "[I]",
      "SUB",
      "FORFAIT",
    ]
  ) {
    assert(output.includes(text), `Missing ${text}`);
  }
  const captainLine = output.split("\n").find((line) =>
    line.includes("Chocobares")
  );
  assert(captainLine?.includes("[C-auto]"));
  const impactLine = output.split("\n").find((line) =>
    line.includes("Wainiqolo")
  );
  assert(impactLine?.includes("[I]") && impactLine.includes("SUB"));
});

Deno.test("composition CLI detailed view preserves the raw historical response", async () => {
  for (const flags of [["--detailed"], ["--detailed", "--json"]]) {
    equal(
      JSON.parse(
        await runCli(["composition", "--round", "4", ...flags], client()),
      ),
      historicalComposition,
    );
  }
});

Deno.test("composition CLI handles manual captain and nullable performance data", async () => {
  const payload = {
    ...historicalComposition,
    compo: {
      ...historicalComposition.compo,
      capitaine_auto: false,
      points: null,
    },
  };
  const output = await runCli(
    ["composition", "1", "--round=4"],
    client(payload),
  );
  assert(output.includes("[C]"));
  assert(!output.includes("[C-auto]"));
  assert(output.includes("Total points: -"));
  const unknownLine = output.split("\n").find((line) =>
    line.includes("Player 4")
  );
  assert(unknownLine && !unknownLine.includes("SUB"));
  assert(!output.includes("null"));
});

Deno.test("composition CLI handles empty slots and absent captain and impact", async () => {
  const output = await runCli(
    ["composition", "1", "--round", "4"],
    client({
      ...historicalComposition,
      compo: {
        ...historicalComposition.compo,
        slots: [],
        capitaine_slot: null,
        impact_slot: null,
      },
    }),
  );
  assert(output.includes("No slots."));
  assert(!output.includes("[C"));
  assert(!output.includes("[I]"));
});

Deno.test("composition CLI validates IDs and rounds before environment or API access", async () => {
  for (
    const args of [
      ["composition", "1", "--round"],
      ["composition", "1/other", "--round", "4"],
      ["composition", "0", "--round", "4"],
      ...["0", "-1", "1.5", "NaN", "1e2", "9007199254740992"].map((
        round,
      ) => ["composition", "1", "--round", round]),
    ]
  ) {
    const error = await rejects(() => runCli(args), "");
    assert(error instanceof ValidationError);
  }
});

Deno.test("composition CLI defaults to resource 1 and the current endpoint", async () => {
  const payload = currentComposition;
  for (
    const args of [["composition", "--json"], [
      "composition",
      "--detailed",
    ]]
  ) {
    const currentClient = new FantasyClient({
      baseUrl: "https://example.test",
      token: "test-token",
      fetch: (url) => {
        equal(url.pathname, "/api/compos/1");
        return Promise.resolve(Response.json(payload));
      },
    });
    equal(JSON.parse(await runCli(args, currentClient)), payload);
  }
});

Deno.test("composition CLI accepts an explicit resource ID for the current endpoint", async () => {
  const payload = { additional_field: "preserved" };
  const currentClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) => {
      equal(url.pathname, "/api/compos/2");
      return Promise.resolve(Response.json(payload));
    },
  });
  equal(
    JSON.parse(await runCli(["composition", "2", "--json"], currentClient)),
    payload,
  );
});

Deno.test("composition CLI uses resource 1 when a round is specified without an ID", async () => {
  equal(
    JSON.parse(
      await runCli(["composition", "--round", "4", "--json"], client()),
    ),
    historicalComposition,
  );
});

Deno.test("composition CLI rejects invalid IDs even when no round is specified", async () => {
  for (const id of ["0", "-1", "1.5", "bad", "9007199254740992"]) {
    const error = await rejects(() => runCli(["composition", id]), "");
    assert(error instanceof ValidationError);
  }
});

Deno.test("composition CLI propagates errors from the current endpoint", async () => {
  const failingClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) => {
      equal(url.pathname, "/api/compos/1");
      return Promise.resolve(new Response(null, { status: 404 }));
    },
  });
  const error = await rejects(
    () => runCli(["composition", "--json"], failingClient),
    "HTTP 404",
  );
  assert(error instanceof FantasyHttpError);
});

Deno.test("composition CLI help works without a token or network permissions", async () => {
  const output = await runCli(["composition", "--help"]);
  assert(output.includes("--round"));
  assert(output.includes("--json"));
  assert(output.includes("--detailed"));
});

Deno.test("composition CLI propagates missing-composition HTTP errors", async () => {
  const failingClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(new Response(null, { status: 404 })),
  });
  const error = await rejects(
    () => runCli(["composition", "1", "--round", "4", "--json"], failingClient),
    "HTTP 404",
  );
  assert(error instanceof FantasyHttpError);
});

Deno.test("current composition defaults to a compact table with unavailable outcomes", async () => {
  const currentClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) => {
      equal(url.pathname, "/api/compos/1");
      return Promise.resolve(Response.json(currentComposition));
    },
  });
  const output = await runCli(["composition"], currentClient);
  for (
    const text of [
      "Round 5",
      "Deadline: 2026-10-03T12:30:00.000Z",
      "Status: validee",
      "Total points: -",
      "Test team",
      "Budget: 11.15 / Cap: 11.00",
      "Paid",
      "Min",
      "Score",
      "Points",
    ]
  ) {
    assert(output.includes(text), `Missing ${text}`);
  }
  const rows = output.split("\n").filter((line) =>
    line.includes("Test Player")
  );
  equal(rows.length, 17);
  assert(rows[7].includes("[C]"));
  assert(rows[16].includes("[I]"));
  assert(rows.every((row) => /0\.42\s+-\s+-\s+-/.test(row)));
  assert(!output.includes("SUB"));
  assert(!output.includes("extra_response_field"));
});

Deno.test("current composition handles empty or absent selections", async () => {
  for (
    const compo of [null, {
      ...currentComposition.compo!,
      slots: [],
      capitaine_slot: null,
      impact_slot: null,
    }]
  ) {
    const currentClient = new FantasyClient({
      baseUrl: "https://example.test",
      token: "test-token",
      fetch: () =>
        Promise.resolve(Response.json({ ...currentComposition, compo })),
    });
    const output = await runCli(["composition"], currentClient);
    assert(output.includes("No slots."));
    assert(!output.includes("[C]"));
    assert(!output.includes("[I]"));
  }
});
