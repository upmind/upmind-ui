import { includes, values } from "lodash-es";

/**
 * Validates a template value against valid enum values.
 * Returns the value if valid, otherwise returns the fallback.
 */
export function validateTemplate<T extends string>(
  value: string | undefined,
  validValues: Record<string, T>,
  fallback: T
): T {
  return includes(values(validValues), value) ? (value as T) : fallback;
}
