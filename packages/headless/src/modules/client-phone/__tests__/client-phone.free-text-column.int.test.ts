// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the free-text column the API actually accepts
 *
 * ## Job To Be Done
 * A search on the client's phone list must NARROW the list, not break it. This
 * drives the REAL `useClientPhones()` through one free-text write and reads the
 * collection back: it stays readable and it still holds rows.
 *
 * ## The recorded evidence behind it
 * `pnpm fixtures:generate client-phone` captured both candidate columns against
 * real staging:
 *
 * - `…-case-number-like-…json` — `filter[number|like]=%111%` → **HTTP 500**,
 *   `{"code":500,"message":"A critical database error occurred"}`. `number` is
 *   the MODEL's own key, spelled straight onto the wire.
 * - `…-case-phone-like-…json` — `filter[phone|like]=%111%` → **HTTP 200**,
 *   4 rows of 10. `phone` is the column the recorded row bodies carry, and the
 *   one the schema's free-text branch binds the model key to.
 *
 * The handler replays exactly that split, so this spec holds only while that
 * binding does: the model key below is still `number`, and the read survives
 * because the wire key it leaves as is `phone`. It is isolated in its own file
 * because the 500's retries would otherwise leak into a sibling test's request
 * count.
 *
 * ## What Breaks If This Fails
 * The user types into the phone search box and the whole list disappears behind
 * a load error — the wire key the migration adopted is one the endpoint rejects.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientPhones } from "..";
import {
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import {
  installPhonesHandler,
  recordedNeedle
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Long enough for the failing read's retries to be spent. */
const RETRIES_SPENT_MS = 2000;

describe("client-phone — a free-text search narrows the list", () => {
  it("leaves the collection readable and still holding rows", async () => {
    const { clientId } = await seedClientSession(server);
    installPhonesHandler(server, clientId);
    const phones = useClientPhones();
    await phones.isReady();

    const needle = recordedNeedle();
    const observed = observeRequests(server, "/phones");

    phones.setCriteria({ filters: { number: { like: needle } } } as never);

    await vi.waitFor(() =>
      expect(observed.filterKeys().length).toBeGreaterThan(0)
    );
    // A rejected read retries, so `isLoading` is not a settle signal here; the
    // claim is about what the collection holds once the retries are spent.
    await new Promise(resolve => setTimeout(resolve, RETRIES_SPENT_MS));
    observed.stop();

    expect(phones.meta.value.hasError).toBe(false);
    expect(phones.data.value.length).toBeGreaterThan(0);
  });
});
