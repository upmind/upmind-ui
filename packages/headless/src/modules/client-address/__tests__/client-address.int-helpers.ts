// -----------------------------------------------------------------------------
/**
 * @module client-address/__tests__/client-address.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handler that answers with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate client-address` against real staging — no spec builds
 * a wire body of its own.
 */

import { http, HttpResponse } from "msw";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  heldFor,
  narrowByLike,
  windowOf
} from "../../../__tests__/criteria-int-kit";
import { recordingsDir } from "./setup.integration";
import type {
  Envelope,
  ResponseTiming
} from "../../../__tests__/criteria-int-kit";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/** One address as the recorded wire carries it. */
export type WireAddress = {
  id: string;
  client_id: string;
  name: string;
  default: boolean;
  address_1: string;
  country_id: string;
};

export const recorded = {
  /** `?limit=2&offset=0` — the real first page of 98. */
  pageOne: () =>
    getFixtureBody<Envelope<WireAddress[]>>(
      "get-clients-id-addresses-case-page-1",
      { recordingsDir }
    ),
  /** `?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireAddress[]>>(
      "get-clients-id-addresses-case-page-2",
      { recordingsDir }
    ),
  /** `?filter[name|like]=%…%` — the API's own answer to the migrated key. */
  nameLike: () =>
    getFixtureBody<Envelope<WireAddress[]>>(
      "get-clients-id-addresses-case-name-like-filter-name-like-10",
      { recordingsDir }
    )
};

/** The 4-row corpus the recorded pages add up to. */
export function corpus(): WireAddress[] {
  return [...recorded.pageOne().data, ...recorded.pageTwo().data];
}

/**
 * Serves the recorded corpus narrowed by the request's OWN
 * `filter[name|like]` and windowed by its own `limit`/`offset` — so a filter or
 * page assertion is answered by the subset the server would return, never a
 * handler that ignores the url.
 */
export function installAddressesHandler(
  server: SetupServer | undefined,
  clientId: string,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  let reads = 0;

  server?.use(
    http.get(`*/clients/${clientId}/addresses`, async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      const matched = narrowByLike(corpus(), params, "name", row => row.name);
      await heldFor(params, options);
      return HttpResponse.json(
        {
          ...envelope,
          data: windowOf(matched, params),
          total: matched.length
        },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads };
}
