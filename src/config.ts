export interface FantasyConfig {
  baseUrl: string;
  token: string;
}

/** Read only the two connector environment variables. */
export function loadConfig(
  getEnv: (name: string) => string | undefined = (name) => Deno.env.get(name),
): FantasyConfig {
  const token = getEnv("FANTASY_TOKEN")?.trim();
  if (!token) {
    throw new Error("FANTASY_TOKEN is required and must not be blank.");
  }
  return {
    token,
    baseUrl: getEnv("FANTASY_API_URL")?.trim() ?? "https://fantasy.poneeey.fr",
  };
}
