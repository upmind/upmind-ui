// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.wire
 * @description The live wire of ONE replayed scenario: the requests the module
 * itself sent, as the replay's passive observer saw them, and the scenario
 * they belong to. The replay opens the window before the first step boots the
 * product and closes it after the last; the step catalog only reads it. A wire line never reads a
 * recording to prove what went out — the replay matcher ignores `limit`,
 * `offset`, `order` and `with`, so only the live request can.
 */

import { filter, flatMap, map } from "lodash-es";

// -----------------------------------------------------------------------------

/** One request the module sent, as the observer saw it. */
export type SentRequest = { method: string; url: string };

/** The observer the replay opens the window with. */
export type WireSource = { all: () => SentRequest[]; stop: () => void };

/** One request body the module sent, as the body observer saw it. */
export type SentBody = SentRequest & { body: Promise<unknown> };

/** The body observer the replay opens the window with. */
export type BodySource = { all: () => SentBody[]; stop: () => void };

let source: WireSource | undefined;
let bodies: BodySource[] = [];
let bodiesAtWhen: number[] = [];
let scenario = "";
let whenStartsAt = 0;

/** Opens the window of one scenario over the replay's observer. */
export function openWire(
  name: string,
  observer: WireSource,
  ...bodyObservers: BodySource[]
): void {
  source = observer;
  bodies = bodyObservers;
  bodiesAtWhen = map(bodyObservers, () => 0);
  scenario = name;
  whenStartsAt = 0;
}

/** Closes the window and stops its observer. */
export function closeWire(): void {
  source?.stop();
  for (const observer of bodies) observer.stop();
  source = undefined;
  bodies = [];
  bodiesAtWhen = [];
  scenario = "";
  whenStartsAt = 0;
}

/** The scenario the window belongs to. */
export const wireScenario = (): string => scenario;

/** Marks where the `When` of the scenario starts. */
export function markWhen(): void {
  whenStartsAt = source?.all().length ?? 0;
  bodiesAtWhen = map(bodies, observer => observer.all().length);
}

/** Each request of the whole window that `match` selects. */
export const sentInWindow = (
  match: (request: URL, method: string) => boolean
) =>
  filter(source?.all() ?? [], ({ url, method }) => match(new URL(url), method));

/** Each request the `When` sent that `match` selects. */
export const sentByWhen = (match: (request: URL, method: string) => boolean) =>
  filter((source?.all() ?? []).slice(whenStartsAt), ({ url, method }) =>
    match(new URL(url), method)
  );

/** Each body of the whole window that `match` selects, resolved. */
export const bodiesInWindow = (
  match: (request: URL, method: string) => boolean
): Promise<unknown[]> =>
  Promise.all(
    filter(
      flatMap(bodies, observer => observer.all()),
      ({ url, method }) => match(new URL(url), method)
    ).map(({ body }) => body)
  );

/** Each body the `When` sent that `match` selects, resolved. */
export const bodiesByWhen = (
  match: (request: URL, method: string) => boolean
): Promise<unknown[]> =>
  Promise.all(
    filter(
      flatMap(bodies, (observer, index) =>
        observer.all().slice(bodiesAtWhen[index])
      ),
      ({ url, method }) => match(new URL(url), method)
    ).map(({ body }) => body)
  );
