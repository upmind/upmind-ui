// -----------------------------------------------------------------------------
/**
 * @fileoverview product-catalogue — a caller-seeded page survives mount
 *
 * ## Job To Be Done
 * A `?page=N` deep link opens the catalogue with a seeded
 * `pagination: { limit, offset }`. The composable derives `filters` (from
 * `search`/`categoryId`) and `sort` (from `sortBy`/`direction`) itself at mount.
 * Those derived branches and the caller's seeded pagination must land as ONE
 * model — the seeded offset SURVIVES rather than resetting to page one. This
 * drives the REAL `useProductCatalogue` against MSW-replayed staging recordings
 * and reads back the criteria the handle publishes.
 *
 * ## What this pins
 * Previously the derived branches arrived as a SECOND write at mount and reset
 * `offset` to 0, so every `?page=N` deep link opened on page 1. Claim 1 proves
 * the seeded page survives beside the derived filters and sort in one model.
 * Claim 2 proves `setCriteria`'s own reset law is untouched: a LATER write with
 * no pagination still returns `offset` to 0, with the page size kept.
 *
 * ## What Breaks If These Fail
 * Deep links, bookmarks, and shared catalogue URLs silently open on page one —
 * the customer never reaches the page they asked for.
 */

import { describe, expect, it, vi } from "vitest";
import { useProductCatalogue } from "..";
import { seedClientSession } from "../../../__tests__/criteria-int-kit";
import { PRODUCT_DEFAULT_SORT } from "../product-catalogue.types";
import {
  installCategoriesHandler,
  installProductsHandler,
  recordedNeedle
} from "./product-catalogue.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Long enough for the mount-time derived writes to have settled. */
const SETTLED_MS = 1000;

const SEED_LIMIT = 10;
const SEED_OFFSET = 20;

async function bootCatalogue(
  initial?: Parameters<typeof useProductCatalogue>[0]
): Promise<ReturnType<typeof useProductCatalogue>> {
  await seedClientSession(server, { withBrandConfig: false });
  installCategoriesHandler(server);
  installProductsHandler(server);
  return useProductCatalogue(initial);
}

// -----------------------------------------------------------------------------

describe("product-catalogue — a caller-seeded page survives mount", () => {
  it("keeps the seeded pagination beside the derived filters and sort in one model", async () => {
    const needle = recordedNeedle();

    const catalogue = await bootCatalogue({
      search: needle,
      pagination: { limit: SEED_LIMIT, offset: SEED_OFFSET }
    });

    await new Promise(resolve => setTimeout(resolve, SETTLED_MS));

    expect(catalogue.criteria.value).toEqual({
      filters: { name: { like: needle } },
      sort: PRODUCT_DEFAULT_SORT,
      pagination: { limit: SEED_LIMIT, offset: SEED_OFFSET }
    });
  });

  it("returns offset to page one on a later write with no pagination, page size kept", async () => {
    const needle = recordedNeedle();

    const catalogue = await bootCatalogue({
      pagination: { limit: SEED_LIMIT, offset: SEED_OFFSET }
    });

    await new Promise(resolve => setTimeout(resolve, SETTLED_MS));

    catalogue.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() =>
      expect(catalogue.criteria.value.pagination).toEqual({
        limit: SEED_LIMIT,
        offset: 0
      })
    );
  });
});
