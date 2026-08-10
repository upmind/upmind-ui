// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handler that answers with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate client-custom-fields` against real staging.
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

/** One custom field as the recorded wire carries it. */
export type WireCustomField = {
  id: string;
  name: string;
  order: number;
  object_type: string;
  type: number;
};

export const recorded = {
  /** `?limit=1&offset=0&order=order` — the real first page of two. */
  pageOne: () =>
    getFixtureBody<Envelope<WireCustomField[]>>(
      "get-custom-fields-case-page-1-filter-object-type-client",
      { recordingsDir }
    ),
  /** `?limit=1&offset=1&order=order` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireCustomField[]>>(
      "get-custom-fields-case-page-2-filter-object-type-client",
      { recordingsDir }
    ),
  /** `?filter[name|like]=%…%` — the API's own answer to the migrated key. */
  nameLike: () =>
    getFixtureBody<Envelope<WireCustomField[]>>(
      "get-custom-fields-case-name-like-filter-name-like-age-filter-object-type-client",
      { recordingsDir }
    )
};

/** The 2-row corpus the recorded pages add up to. */
export function corpus(): WireCustomField[] {
  return [...recorded.pageOne().data, ...recorded.pageTwo().data];
}

/** A needle a row the recorded corpus holds really matches. */
export function recordedNeedle(): string {
  return corpus()[0].name.slice(0, 3);
}

/**
 * Serves the recorded corpus narrowed by the request's OWN
 * `filter[name|like]`, ordered by its OWN `order=` param, and windowed by its
 * own `limit`/`offset`.
 */
export function installCustomFieldsHandler(
  server: SetupServer | undefined,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  let reads = 0;

  server?.use(
    http.get("*/custom_fields", async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      const matched = narrowByLike(corpus(), params, "name", row => row.name);
      const ordered = params.get("order")?.startsWith("-")
        ? [...matched].reverse()
        : matched;
      await heldFor(params, options);
      return HttpResponse.json(
        {
          ...envelope,
          data: windowOf(ordered, params),
          total: ordered.length
        },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads };
}
