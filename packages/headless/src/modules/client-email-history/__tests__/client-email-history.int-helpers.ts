// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handler that answers with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate client-email-history` against real staging.
 */

import { http, HttpResponse } from "msw";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  heldFor,
  narrowByBoolean,
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

/** One sent email as the recorded wire carries it. */
export type WireSentEmail = {
  id: string;
  subject: string;
  sent: boolean;
  bounced: boolean;
  error_id: string | null;
  created_at: string;
};

export const recorded = {
  /** `?limit=2&offset=0&order=-created_at` — the real first page of 2 866. */
  pageOne: () =>
    getFixtureBody<Envelope<WireSentEmail[]>>(
      "get-self-email-history-case-page-1",
      { recordingsDir }
    ),
  /** `?limit=2&offset=2&order=-created_at` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireSentEmail[]>>(
      "get-self-email-history-case-page-2",
      { recordingsDir }
    ),
  /** `?filter[subject|like]=%…%` — the API's own answer to the migrated key. */
  subjectLike: () =>
    getFixtureBody<Envelope<WireSentEmail[]>>(
      "get-self-email-history-case-subject-like-filter-subject-like-welcom",
      { recordingsDir }
    ),
  /** `?filter[sent|eq]=1` — a real narrowed answer. */
  sentEq: () =>
    getFixtureBody<Envelope<WireSentEmail[]>>(
      "get-self-email-history-case-sent-eq-filter-sent-eq-1",
      { recordingsDir }
    ),
  /** `?filter[bounced|eq]=1` — a real EMPTY answer; nothing bounced. */
  bouncedEq: () =>
    getFixtureBody<Envelope<WireSentEmail[]>>(
      "get-self-email-history-case-bounced-eq-filter-bounced-eq-1",
      { recordingsDir }
    ),
  /** `?filter[error_id|neq]=null` — the column the legacy wire already spelled. */
  errorNeq: () =>
    getFixtureBody<Envelope<WireSentEmail[]>>(
      "get-self-email-history-case-error-neq-filter-error-id-neq-null",
      { recordingsDir }
    )
};

/** The corpus every recorded capture contributes a row to. */
export function corpus(): WireSentEmail[] {
  const rows = [
    ...recorded.pageOne().data,
    ...recorded.pageTwo().data,
    ...recorded.subjectLike().data,
    ...recorded.sentEq().data,
    ...recorded.errorNeq().data
  ];
  return [...new Map(rows.map(row => [row.id, row])).values()];
}

/** A subject needle the recorded corpus really contains. */
export function recordedNeedle(): string {
  return recorded.subjectLike().data[0].subject.slice(0, 6);
}

/**
 * Serves the recorded corpus narrowed by the request's OWN
 * `filter[subject|like]` / `filter[sent|eq]` / `filter[bounced|eq]` /
 * `filter[error_id|neq]`, and windowed by its own `limit`/`offset`.
 */
export function installEmailHistoryHandler(
  server: SetupServer | undefined,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  let reads = 0;

  server?.use(
    http.get("*/self/email_history", async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;

      let rows = narrowByLike(corpus(), params, "subject", row => row.subject);
      rows = narrowByBoolean(rows, params, "sent", row => row.sent);
      rows = narrowByBoolean(rows, params, "bounced", row => row.bounced);
      const errorNeq = params.get("filter[error_id|neq]");
      if (errorNeq === "null") rows = rows.filter(row => row.error_id !== null);

      await heldFor(params, options);
      return HttpResponse.json(
        { ...envelope, data: windowOf(rows, params), total: rows.length },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads };
}
