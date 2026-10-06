// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.wire
 * @description The live wire of ONE replayed scenario: the requests the module
 * sent, as the replay's passive observer saw them. The replay opens the window
 * before the scenario boots and closes it after; the step catalog only reads
 * it. The replay matcher ignores `limit`, `offset`, `order` and `with`, so only
 * the live request can prove them.
 */

import { filter, last, map, slice } from "lodash-es";

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
