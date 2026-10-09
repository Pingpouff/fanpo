/** Prices are expressed in millions by Fanpo; store whole euros. */
export function money(value: string): number {
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) {
    throw new Error(`Invalid money value: ${value}`);
  }
  const [whole, fraction = ""] = value.split(".");
  const units = Number(whole) * 1_000_000 + Number(fraction.padEnd(6, "0"));
  if (!Number.isSafeInteger(units)) throw new Error("Invalid money range");
  return units;
}
