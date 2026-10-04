import { loadConfig } from "../src/config.ts";
import { equal, throws } from "./helpers.ts";

Deno.test("configuration requires a nonblank token", () => {
  for (const token of [undefined, "", "  "]) {
    throws(() => loadConfig(() => token), "FANTASY_TOKEN");
  }
});

Deno.test("configuration defaults the URL and trims the token", () => {
  equal(
    loadConfig((name) => name === "FANTASY_TOKEN" ? " test-token " : undefined),
    {
      token: "test-token",
      baseUrl: "https://fantasy.poneeey.fr",
    },
  );
});

Deno.test("configuration uses the custom API URL", () => {
  equal(
    loadConfig((name) =>
      name === "FANTASY_TOKEN" ? "test-token" : "http://localhost:8000"
    ),
    {
      token: "test-token",
      baseUrl: "http://localhost:8000",
    },
  );
});
