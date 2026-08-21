// -----------------------------------------------------------------------------
/**
 * @module product-categories/__tests__/product-categories.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handler that answers with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate product-categories` against real staging.
 */

import { http, HttpResponse } from "msw";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { heldFor, windowOf } from "../../../__tests__/criteria-int-kit";
import { recordingsDir } from "./setup.integration";
import type {
  Envelope,
  ResponseTiming
} from "../../../__tests__/criteria-int-kit";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/** One category as the recorded wire carries it, subcategories expanded. */
export type WireCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  subcategories?: WireCategory[];
};

export const recorded = {
  /** `?limit=0` — the unpaged read the schema's own default asks for. */
  unpaged: () =>
    getFixtureBody<Envelope<WireCategory[]>>(
      "get-basket-products-categories-case-unpaged",
      { recordingsDir }
    ),
  /** `?limit=2&offset=0` — the real first page. */
  pageOne: () =>
    getFixtureBody<Envelope<WireCategory[]>>(
      "get-basket-products-categories-case-page-1",
      { recordingsDir }
    ),
  /** `?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireCategory[]>>(
      "get-basket-products-categories-case-page-2",
      { recordingsDir }
    )
};

/** Serves the recorded tree, windowed by the request's own limit/offset. */
export function installCategoriesHandler(
  server: SetupServer | undefined,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.unpaged();
  let reads = 0;

  server?.use(
    http.get("*/basket/products_categories", async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      await heldFor(params, options);
      return HttpResponse.json(
        {
          ...envelope,
          data: windowOf(envelope.data, params),
          total: envelope.data.length
        },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads };
}
