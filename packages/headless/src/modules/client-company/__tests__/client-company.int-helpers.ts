// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handler that answers with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate client-company` against real staging — no spec builds
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

/** One company as the recorded wire carries it. */
export type WireCompany = {
  id: string;
  client_id: string;
  name: string;
  default: boolean;
};

export const recorded = {
  /** `?limit=2&offset=0` — the real first page of 79. */
  pageOne: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-page-1",
      { recordingsDir }
    ),
  /** `?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-page-2",
      { recordingsDir }
    ),
  /** `?filter[name|like]=%…%` — the API's own answer to the migrated key. */
  nameLike: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-name-like-filter-name-like-heg",
      { recordingsDir }
    )
};

/** The 4-row corpus the recorded pages add up to. */
export function corpus(): WireCompany[] {
  return [...recorded.pageOne().data, ...recorded.pageTwo().data];
}

/**
 * Serves the recorded corpus narrowed by the request's OWN
 * `filter[name|like]` and windowed by its own `limit`/`offset`.
 */
export function installCompaniesHandler(
  server: SetupServer | undefined,
  clientId: string,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  let reads = 0;

  server?.use(
    http.get(`*/clients/${clientId}/companies`, async ({ request }) => {
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
