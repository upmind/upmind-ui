// -----------------------------------------------------------------------------
/**
 * @module client-phone/__tests__/client-phone.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handler that answers with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate client-phone` against real staging — including the
 * failure. The handler below reproduces the recorded DISAGREEMENT rather than
 * smoothing it over: staging answers `filter[phone|…]` with a narrowed 200 and
 * `filter[number|…]` with a 500, so this handler does too.
 */

import { http, HttpResponse } from "msw";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
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

/** One phone as the recorded wire carries it — the column is `phone`. */
export type WirePhone = {
  id: string;
  client_id: string;
  phone: string;
  full_phone: string;
  default: boolean;
  verified: boolean;
};

export const recorded = {
  /** `?limit=2&offset=0` — the real first page of 10. */
  pageOne: () =>
    getFixtureBody<Envelope<WirePhone[]>>("get-clients-id-phones-case-page-1", {
      recordingsDir
    }),
  /** `?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WirePhone[]>>("get-clients-id-phones-case-page-2", {
      recordingsDir
    }),
  /** `?filter[phone|like]=%…%` — a real narrowed answer, 4 of 10. */
  phoneLike: () =>
    getFixture("get-clients-id-phones-case-phone-like-filter-phone-like-111", {
      recordingsDir
    }),
  /**
   * `?filter[number|like]=%…%` — the 500 staging answers the model's own key
   * spelled straight onto the wire. Recorded verbatim; nothing here staged it.
   */
  numberLike: () =>
    getFixture(
      "get-clients-id-phones-case-number-like-filter-number-like-111",
      { recordingsDir }
    )
};

/** The 4-row corpus the recorded pages add up to. */
export function corpus(): WirePhone[] {
  return [...recorded.pageOne().data, ...recorded.pageTwo().data];
}

/** A needle the recorded corpus really contains. */
export function recordedNeedle(): string {
  return corpus()[0].phone.slice(-3);
}

/**
 * Answers exactly as staging answered: a `filter[number|…]` key gets the
 * recorded 500 body and its status; a `filter[phone|like]` narrows the recorded
 * corpus; anything else is the windowed corpus.
 */
export function installPhonesHandler(
  server: SetupServer | undefined,
  clientId: string,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  const rejected = recorded.numberLike();
  let reads = 0;

  server?.use(
    http.get(`*/clients/${clientId}/phones`, async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      await heldFor(params, options);

      const undeclaredColumn = [...params.keys()].some(key =>
        key.startsWith("filter[number|")
      );
      if (undeclaredColumn) {
        return HttpResponse.json(rejected.response.body as object, {
          status: rejected.response.status
        });
      }

      const matched = narrowByLike(corpus(), params, "phone", row => row.phone);
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
