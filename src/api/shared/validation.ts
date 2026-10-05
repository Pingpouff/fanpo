export function requirePositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Fantasy API ${label} must be a positive safe integer.`);
  }
}
