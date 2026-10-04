export function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

export function equal(actual: unknown, expected: unknown): void {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
  );
}

export function throws(fn: () => unknown, message: string): void {
  try {
    fn();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(message));
    return;
  }
  throw new Error("Expected an error");
}

export async function rejects(
  fn: () => Promise<unknown>,
  message: string,
): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(message));
    return error;
  }
  throw new Error("Expected a rejection");
}
