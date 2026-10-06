// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.wire
 * @description The live wire of ONE replayed scenario: the requests the module
 * sent, as the replay's passive observer saw them. The replay opens the window
 * before the scenario boots and closes it after; the step catalog only reads
 * it. The replay matcher ignores `limit`, `offset`, `order` and `with`, so only
 * the live request can prove them.
 */

import { differenceWith, filter, isEqual, last, map, slice } from "lodash-es";

// -----------------------------------------------------------------------------

type Sent = { method: string; url: string };

let source: { all: () => Sent[]; stop: () => void } | undefined;
let markedAt = 0;

/** Opens the window of one scenario over the replay's observer. */
export function openWire(observer: {
  all: () => Sent[];
  stop: () => void;
}): void {
  source = observer;
  markedAt = 0;
}

/** Closes the window and stops its observer. */
export function closeWire(): void {
  source?.stop();
  source = undefined;
  markedAt = 0;
}

/** Marks the point the next {@link sentSinceMark} reads from. */
export function markWire(): void {
  markedAt = source?.all().length ?? 0;
}

/** Each request of the whole window that `match` selects, as a URL. */
export const sentInWindow = (match: (request: URL) => boolean): URL[] =>
  filter(
    map(source?.all() ?? [], ({ url }) => new URL(url)),
    match
  );

/** Each request since the last {@link markWire} that `match` selects. */
export const sentSinceMark = (match: (request: URL) => boolean): URL[] =>
  filter(
    map(slice(source?.all() ?? [], markedAt), ({ url }) => new URL(url)),
    match
  );

/** The latest request of the window that `match` selects. */
export const latestSent = (match: (request: URL) => boolean): URL | undefined =>
  last(sentInWindow(match));

// --- engine-free assertions: the catalog runs in vitest and in the browser ---

const shown = (value: unknown): string => JSON.stringify(value) ?? "undefined";

/** Fails with `what` unless `condition` holds. */
export function check(condition: boolean, what: string): void {
  if (!condition) throw new Error(`expected ${what}`);
}

/** Fails unless `actual` deeply equals `expected`. */
export function same(actual: unknown, expected: unknown, what: string): void {
  if (!isEqual(actual, expected))
    throw new Error(
      `expected ${what} to equal ${shown(expected)}, got ${shown(actual)}`
    );
}

/** Fails if `actual` deeply equals `unexpected`. */
export function differs(
  actual: unknown,
  unexpected: unknown,
  what: string
): void {
  if (isEqual(actual, unexpected))
    throw new Error(`expected ${what} not to equal ${shown(unexpected)}`);
}

/** Fails unless every member of `expected` is deeply equal to one of `actual`. */
export function containsAll(
  actual: readonly unknown[],
  expected: readonly unknown[],
  what: string
): void {
  const missing = differenceWith([...expected], [...actual], isEqual);
  if (missing.length)
    throw new Error(
      `expected ${what} to hold ${shown(missing)}, got ${shown(actual)}`
    );
}
