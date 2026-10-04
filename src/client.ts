import type { PlayerSheetResponse, PlayersResponse } from "./types.ts";

export interface FantasyClientOptions {
  baseUrl: string;
  token: string;
  /** Defaults to native fetch; can be replaced for offline tests. */
  fetch?: (url: URL, init: RequestInit) => Promise<Response>;
}

/** An API HTTP failure. Response bodies are omitted to avoid leaking credentials. */
export class FantasyHttpError extends Error {
  constructor(public readonly status: number, path: string) {
    super(`Fantasy API GET ${path} returned HTTP ${status}.`);
    this.name = "FantasyHttpError";
  }
}

/** Reusable client with no dependency on the CLI or environment variables. */
export class FantasyClient {
  readonly #baseUrl: URL;
  readonly #token: string;
  readonly #fetch: NonNullable<FantasyClientOptions["fetch"]>;

  constructor(options: FantasyClientOptions) {
    const token = options.token.trim();
    if (!token) throw new Error("Fantasy API token must not be blank.");
    let baseUrl: URL;
    try {
      baseUrl = new URL(options.baseUrl);
    } catch {
      throw new Error("Fantasy API base URL must be an absolute HTTP(S) URL.");
    }
    if (
      !["http:", "https:"].includes(baseUrl.protocol) ||
      baseUrl.username || baseUrl.password
    ) {
      throw new Error(
        "Fantasy API base URL must use HTTP(S) without embedded credentials.",
      );
    }
    this.#baseUrl = baseUrl;
    this.#token = token;
    this.#fetch = options.fetch ?? fetch;
  }

  getPlayers(): Promise<PlayersResponse> {
    return this.#get<PlayersResponse>("/api/joueurs");
  }

  getPlayerSheet(playerId: number): Promise<PlayerSheetResponse> {
    if (!Number.isSafeInteger(playerId) || playerId <= 0) {
      throw new Error("Fantasy API player ID must be a positive safe integer.");
    }
    return this.#get<PlayerSheetResponse>(`/api/joueurs/${playerId}/fiche`);
  }

  async #get<T>(path: string): Promise<T> {
    let response: Response;
    try {
      response = await this.#fetch(new URL(path, this.#baseUrl), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.#token}`,
          Accept: "application/json",
        },
        redirect: "error",
      });
    } catch (cause) {
      throw new Error(`Fantasy API GET ${path} request failed.`, { cause });
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new FantasyHttpError(response.status, path);
    }
    try {
      return await response.json() as T;
    } catch (cause) {
      throw new Error(`Fantasy API GET ${path} returned invalid JSON.`, {
        cause,
      });
    }
  }
}
