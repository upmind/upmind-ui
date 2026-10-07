// -----------------------------------------------------------------------------
/**
 * @fileoverview The Nuxt cart's routes build without a Vue Router warning.
 *
 * ## Job To Be Done
 * The platform hands a session to `/auth/transfer/`, an absolute alias of the
 * transfer page; building the routes raises no router warning.
 *
 * ## What Breaks If These Fail
 * Every page load logs a Vue Router warning about the hand-off alias.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import routerOptions from "../app/router.options";
import { filter, includes, map, toString } from "lodash-es";

vi.mock("@sentry/nuxt", () => ({}));

// -----------------------------------------------------------------------------

function routerWarnings(spy: ReturnType<typeof vi.spyOn>): string[] {
  return filter(
    map(spy.mock.calls, call => toString(call[0])),
    message => includes(message, "[Vue Router warn]")
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// -----------------------------------------------------------------------------

describe("the platform's session hand-off path", () => {
  it("builds the routes without a router warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    createRouter({
      history: createMemoryHistory(),
      routes: routerOptions.routes([])
    });

    expect(routerWarnings(warn)).toEqual([]);
  });
});
