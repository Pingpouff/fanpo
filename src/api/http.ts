/** HTTP timings cover fetch, body read and JSON parsing; bytes are decoded body bytes. */
export interface RequestMetadata {
  endpoint: string;
  startedAt: string;
  durationMs: number;
  responseBytes: number | null;
  status: number | null;
  outcome: "success" | "network-error" | "http-error" | "invalid-json";
}
export type RequestObserver = (metadata: RequestMetadata) => void;

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

/** Shared authenticated HTTP transport for endpoint modules. */
export class FantasyHttpClient {
  readonly #observers = new Set<RequestObserver>();
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

  observeRequests(observer: RequestObserver): () => void {
    this.#observers.add(observer);
    return () => {
      this.#observers.delete(observer);
    };
  }

  async get<T>(path: string): Promise<T> {
    const startedAt = new Date().toISOString(), started = performance.now();
    let status: number | null = null, responseBytes: number | null = null;
    let outcome: RequestMetadata["outcome"] = "network-error";
    try {
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
      status = response.status;
      if (!response.ok) {
        outcome = "http-error";
        await response.body?.cancel();
        throw new FantasyHttpError(response.status, path);
      }
      outcome = "invalid-json";
      try {
        const bytes = await response.arrayBuffer();
        responseBytes = bytes.byteLength;
        const value = JSON.parse(new TextDecoder().decode(bytes)) as T;
        outcome = "success";
        return value;
      } catch (cause) {
        throw new Error(`Fantasy API GET ${path} returned invalid JSON.`, {
          cause,
        });
      }
    } finally {
      const metadata: RequestMetadata = {
        endpoint: path,
        startedAt,
        durationMs: performance.now() - started,
        responseBytes,
        status,
        outcome,
      };
      for (const observer of this.#observers) {
        // Observability must not alter API results or turn a completed request into a failure.
        try {
          observer({ ...metadata });
        } catch { /* Observer errors are isolated from the transport. */ }
      }
    }
  }
}
