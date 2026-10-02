// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/msw-handlers
 * @description Builds MSW request handlers from a recorded fixture directory:
 * {@link handlersFor} (`./fixture-handlers`, the matching) over every fixture
 * the directory holds.
 */

import { handlersFor } from "./fixture-handlers";
import type { ReplayTiming } from "./fixture-handlers";
import { loadAllFixtures } from "./index";
import type { HttpHandler } from "msw";
import type { NormalizedFixture } from "./types";

// -----------------------------------------------------------------------------

/**
 * Build the MSW handler list from every fixture in the pool. Fixtures sharing a
 * (method, templated-path) share one handler; the resolver picks the best
 * fixture by identity-param match, falling back to the least-specific one.
 */
export function buildHandlers(
  opts?: { recordingsDir?: string } & ReplayTiming
): HttpHandler[] {
  return handlersFor(loadAllFixtures(opts), opts);
}

export type { NormalizedFixture };
