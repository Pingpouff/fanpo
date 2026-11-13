export interface ApplicationPaths {
  config: string;
  database: string;
  cache: string;
}

/** Pure path resolution, separate from environment access for source CLI users. */
export function applicationPaths(
  os: string,
  env: Record<string, string | undefined>,
): ApplicationPaths {
  if (os === "windows") {
    if (!env.LOCALAPPDATA) throw new Error("LOCALAPPDATA is required");
    const base = `${env.LOCALAPPDATA}\\Fanpo`;
    return {
      config: `${base}\\env`,
      database: `${base}\\fanpo.sqlite`,
      cache: `${base}\\Cache`,
    };
  }
  if (os === "darwin") {
    if (!env.HOME) throw new Error("HOME is required");
    const base = `${env.HOME}/Library`;
    return {
      config: `${base}/Application Support/Fanpo/env`,
      database: `${base}/Application Support/Fanpo/fanpo.sqlite`,
      cache: `${base}/Caches/Fanpo`,
    };
  }
  const home = env.HOME;
  if (
    !home && !(env.XDG_CONFIG_HOME && env.XDG_DATA_HOME && env.XDG_CACHE_HOME)
  ) {
    throw new Error("HOME or all XDG directory overrides are required");
  }
  for (const key of ["XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME"]) {
    if (env[key] && !env[key]!.startsWith("/")) {
      throw new Error(`${key} must be absolute`);
    }
  }
  return {
    config: `${env.XDG_CONFIG_HOME || `${home}/.config`}/fanpo/env`,
    database: `${
      env.XDG_DATA_HOME || `${home}/.local/share`
    }/fanpo/fanpo.sqlite`,
    cache: `${env.XDG_CACHE_HOME || `${home}/.cache`}/fanpo`,
  };
}

const keys = ["FANTASY_TOKEN", "FANTASY_API_URL"];
/** Deliberately small dotenv subset: literal values, optional matching quotes. */
export function parseEnvironment(
  text: string,
  process: Record<string, string | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (!match) throw new Error(`Invalid configuration at line ${index + 1}`);
    const [, key] = match;
    if (!keys.includes(key)) {
      throw new Error(`Unsupported configuration key at line ${index + 1}`);
    }
    let value = match[2].trim();
    if (/^["']/.test(value)) {
      if (value.length < 2 || value.at(-1) !== value[0]) {
        throw new Error(`Invalid configuration at line ${index + 1}`);
      }
      value = value.slice(1, -1);
    }
    if (!(key in result)) result[key] = value;
  }
  for (const key of keys) {
    if (process[key] !== undefined) result[key] = process[key]!;
  }
  return result;
}

export async function loadUserEnvironment(path: string): Promise<void> {
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
  const values = parseEnvironment(
    text,
    Object.fromEntries(keys.map((key) => [key, Deno.env.get(key)])),
  );
  for (const [key, value] of Object.entries(values)) Deno.env.set(key, value);
}
