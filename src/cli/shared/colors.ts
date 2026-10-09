const ESC = "\x1b[";
/** Matches ipjCouleur() on https://fantasy.poneeey.fr/equipe (2026-10-09). */
export function ratingColor(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return "#5a5f58";
  if (score < 50) return "#D9432F";
  if (score < 70) return "#E08A2E";
  if (score < 80) return "#2E7CD9";
  if (score < 90) return "#2F9E58";
  return "#8B4FD9";
}
export function foreground(text: string, hex: string): string {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `${ESC}38;2;${rgb.join(";")}m${text}${ESC}39m`;
}
export function bold(text: string): string {
  return `${ESC}1m${text}${ESC}22m`;
}
const palette = {
  info: "#36B6C5",
  good: "#2F9E58",
  caution: "#E08A2E",
  bad: "#D9432F",
  muted: "#8A9188",
};
export function tone(
  text: string,
  kind: keyof typeof palette = "info",
): string {
  return foreground(text, palette[kind]);
}
export function heading(text: string): string {
  return bold(tone(text));
}
/** Apply only to typed status fields, never to arbitrary player names or prose. */
export function status(text: string): string {
  const key = text.toLowerCase();
  const good = [
    "valid",
    "validee",
    "fresh",
    "released",
    "starter",
    "stored",
    "reused",
    "success",
    "network",
    "cache",
    "termine",
    "terminee",
  ];
  const caution = [
    "provisional",
    "stale",
    "substitute",
    "sub",
    "not started",
    "en_cours",
    "a_venir",
    "fixture",
    "missing",
  ];
  const bad = [
    "invalid",
    "locked",
    "absent",
    "forfait",
    "store failed",
    "network-error",
    "http-error",
    "invalid-json",
  ];
  return tone(
    text,
    good.includes(key)
      ? "good"
      : caution.includes(key)
      ? "caution"
      : bad.includes(key)
      ? "bad"
      : "muted",
  );
}
/** Sign means advantage; reverse it for costs where a decrease is favorable. */
export function signed(
  value: number | null | undefined,
  text: string,
  reverse = false,
): string {
  if (value == null || !Number.isFinite(value) || value === 0) {
    return tone(text, "muted");
  }
  return tone(text, (reverse ? -value : value) > 0 ? "good" : "bad");
}
export function colorRating(
  value: number | string | null | undefined,
  text?: string,
): string {
  const score = value == null ? null : Number(value);
  return foreground(
    text ?? (value == null ? "-" : String(value)),
    ratingColor(score),
  );
}
export function stripAnsi(text: string): string {
  return text.replace(
    new RegExp(String.fromCharCode(27) + "\\[[0-?]*[ -/]*[@-~]", "g"),
    "",
  );
}
/** Final human presentation; never applied to JSON. Width-neutral styles only. */
export function humanColors(text: string, noColor = false): string {
  if (noColor) return stripAnsi(text);
  return text
    .replace(
      /^(\s*)((?:Usage|Description|Options|Commands|Examples|API \(live data\)|Data \(local cache\)|Analysis \(projections\)):[^\n]*)/gm,
      (_m, indent: string, title: string) => indent + heading(title),
    )
    .replace(
      /^(Warning:|Error:)/gm,
      (label) => foreground(label, label === "Error:" ? "#D9432F" : "#E08A2E"),
    );
}
