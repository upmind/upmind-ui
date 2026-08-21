// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-handlers.spec
 * @description T3.11 — WHICH requests a forced page takes over (`AC8.3`).
 * Arming answers this module's own endpoints and nothing else, which is why the
 * brand, its settings, the app config and the session still reach staging while
 * a preset is on: an armed page is a forced COLLECTION, never a forced app.
 *
 * The observable is the HANDLER LIST rather than a served body. A foreign
 * request under a catch-all is still performed — the resolver passes it through
 * — so a spec reading only the eventual response stays green while the worker
 * has in fact taken over the whole app.
 *
 * ## What Breaks If These Fail
 * Forcing "empty" empties the chrome too: an undefined brand over every forced
 * page, for the rest of the tab's life, because the singletons that booted it
 * never re-ask.
 *
 * Negative controls: `force-handlers.module-scope.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { runtimeCorpus } from "../corpus";
import { createForceHandlers } from "../handlers";
import { filter, map, size, some } from "lodash-es";
import type { ForcePreset } from "../../composables/useForcedState.types";
import type { HttpHandler } from "msw";

// -----------------------------------------------------------------------------

const bodies = runtimeCorpus()!;

const PRESETS: ForcePreset[] = [
  "empty",
  "loading",
  "error-action",
  "error-collection",
  "replay"
];

const ORIGIN = "https://api.upmind.io/api";

/** The module's own endpoints — what forcing exists to answer. */
const OWN = [
  `${ORIGIN}/clients/CLIENT_ID/emails`,
  `${ORIGIN}/clients/CLIENT_ID/emails/EMAIL_ID`,
  `${ORIGIN}/clients/CLIENT_ID/emails/EMAIL_ID/send_verify`
];

/** The chrome's own boot calls — booted once by singletons that never re-ask. */
const FOREIGN = [
  `${ORIGIN}/brand/settings`,
  `${ORIGIN}/config/brand/values`,
  `${ORIGIN}/clients/self`,
  `${ORIGIN}/oauth/access_token`
];

async function matches(
  handlers: HttpHandler[],
  url: string,
  method = "GET"
): Promise<boolean> {
  const verdicts = await Promise.all(
    map(handlers, handler =>
      handler.test({ request: new Request(url, { method }) } as never)
    )
  );

  return some(verdicts);
}

/** Every url in `urls` the handler list does NOT answer. */
async function unmatched(handlers: HttpHandler[], urls: string[]) {
  const verdicts = await Promise.all(map(urls, url => matches(handlers, url)));

  return filter(urls, (_url, index) => !verdicts[index]);
}

/** Every url in `urls` the handler list DOES answer. */
async function matched(handlers: HttpHandler[], urls: string[]) {
  const verdicts = await Promise.all(map(urls, url => matches(handlers, url)));

  return filter(urls, (_url, index) => verdicts[index]);
}

// -----------------------------------------------------------------------------

describe("AC8.3 arming answers THIS module's endpoints", () => {
  it("matches every one of the module's own routes, on every preset", async () => {
    for (const preset of PRESETS) {
      const handlers = createForceHandlers(preset, bodies);

      expect(size(handlers)).toBeGreaterThan(0);
      expect(await unmatched(handlers, OWN)).toEqual([]);
    }
  });

  it("answers the module's writes too, not only its reads", async () => {
    const handlers = createForceHandlers("error-action", bodies);

    expect(await matches(handlers, OWN[1], "PUT")).toBe(true);
    expect(await matches(handlers, OWN[2], "PATCH")).toBe(true);
  });
});

describe("AC8.3 and NOTHING else — the app's chrome still reaches staging", () => {
  it("matches no request outside the module, on any preset", async () => {
    for (const preset of PRESETS) {
      const handlers = createForceHandlers(preset, bodies);

      expect(await matched(handlers, FOREIGN)).toEqual([]);
    }
  });

  it("registers one handler per declared route and no catch-all beside them", async () => {
    const handlers = createForceHandlers("empty", bodies);

    expect(size(handlers)).toBe(size(OWN));
    for (const handler of handlers) {
      expect(await matched([handler], FOREIGN)).toEqual([]);
    }
  });
});
