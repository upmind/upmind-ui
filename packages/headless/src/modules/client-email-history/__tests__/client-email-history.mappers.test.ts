// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the pure mapper branches the wire cannot
 * reach (AC-3, AC-13)
 *
 * ## Job To Be Done
 * Two branches of this module's mappers are unreachable from any recorded
 * staging capture, and BOTH are pure-function branches:
 *
 * - **AC-3 precedence** — `mapEmailStatus` must resolve `ERROR` over `BOUNCED`
 *   for a row that is both. The staging client this module's fixtures were
 *   captured against has ZERO bounced rows across its entire ~2860-row history;
 *   that is itself a REAL recorded capture, not an assumption —
 *   `fixtures/get-self-email-history-filter-bounced-true.json` carries
 *   `total: 0` with an empty `data` array. No bounced row exists to capture, so
 *   no bounced+error row can.
 * - **AC-13 body defaulting** — `mapReceivedEmail` must yield `""`, never
 *   `undefined`, when a row carries no nested `data.body`. Every real row
 *   sampled while capturing carried a populated one.
 *
 * ## Why these live HERE and not in the `*.int.test.ts` files
 * Both are branches of pure functions (`client-email-history.mappers.ts`) —
 * their contract does not depend on the wire, so the wire's inability to supply
 * the input is a statement about staging's data, not about the branch. Proving
 * a pure branch at the unit layer is the correct layer for it; asserting it
 * through a replayed HTTP response would require inventing that response, which
 * is exactly what `no-hand-rolled-int-fixture` (and NFR-2) exist to stop.
 * Nothing here replays a request, starts a server, or presents any body as a
 * recorded capture.
 *
 * ## Provenance of the inputs
 * Every input below is a REAL recorded row, read from this module's captured
 * fixtures via `getFixtureBody`, with EXACTLY ONE field toggled to construct
 * the hypothetical under test (`bounced: true`; a removed `data.body`). The
 * toggle is stated at each call site. The capture disclosure in
 * `client-email-history.fixtures.ts` stands unchanged — this file does not
 * close that gap in the recorded corpus, it proves the branch the corpus cannot
 * reach.
 *
 * ## What Breaks If These Fail
 * A row that both errored and bounced reports the wrong status to the client
 * (AC-3), or a body-less email surfaces `undefined` where the contract promises
 * a string, crashing every consumer that reads `.body.length` (AC-13).
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { SentEmailStatus, type ISentEmail } from "@upmind-automation/types";
import {
  mapEmailStatus,
  mapReceivedEmail
} from "../client-email-history.mappers";
import type { Envelope, WireEmail } from "./client-email-history.int-helpers";

// -----------------------------------------------------------------------------

/**
 * This module's recorded captures. Resolved directly rather than through
 * `setup.integration`, which starts an MSW replay server no unit test needs.
 */
const recordingsDir = join(import.meta.dirname, "fixtures");

/** A REAL recorded row that carries an `error_id` (`sent:false`, `bounced:false`). */
const recordedErrorRow = (): WireEmail =>
  getFixtureBody<Envelope<WireEmail[]>>(
    "get-self-email-history-filter-error-id-neq-null",
    { recordingsDir }
  ).data[0];

/** The REAL recorded single read — `sent:true`, no error, populated `data.body`. */
const recordedSingleRow = (): WireEmail =>
  getFixtureBody<Envelope<WireEmail>>("get-emails-id", { recordingsDir }).data;

/** `WireEmail` is the recorded wire shape; the mappers are typed on `ISentEmail`. */
const asSentEmail = (row: WireEmail): ISentEmail =>
  row as unknown as ISentEmail;

// -----------------------------------------------------------------------------

describe("client-email-history status resolution — precedence (AC-3)", () => {
  it("AC-3 resolves ERROR over BOUNCED for a row that is both — a real recorded error row with bounced toggled true", () => {
    const row = recordedErrorRow();
    expect(row.error_id).toBeTruthy();
    expect(row.bounced).toBe(false);

    // The ONE toggle: staging has no bounced row to capture (total:0), so the
    // bounced+error row is constructed from a real errored one.
    const bouncedAndErrored = { ...row, bounced: true };

    expect(mapEmailStatus(asSentEmail(bouncedAndErrored))).toBe(
      SentEmailStatus.ERROR
    );
  });

  it("AC-3 keeps BOTH facts on meta while status resolves to ERROR — the bounce is reported, never overwritten", () => {
    const bouncedAndErrored = { ...recordedErrorRow(), bounced: true };

    const mapped = mapReceivedEmail(asSentEmail(bouncedAndErrored));

    expect(mapped.status).toBe(SentEmailStatus.ERROR);
    expect(mapped.meta.isError).toBe(true);
    expect(mapped.meta.isBounced).toBe(true);
  });

  it("AC-3 resolves BOUNCED over SENT for a row that is both — a real recorded sent row with bounced toggled true", () => {
    const row = recordedSingleRow();
    expect(row.sent).toBe(true);
    expect(row.error_id).toBeNull();

    const bouncedAndSent = { ...row, bounced: true };

    expect(mapEmailStatus(asSentEmail(bouncedAndSent))).toBe(
      SentEmailStatus.BOUNCED
    );
  });
});

describe("client-email-history single read — the body default (AC-13)", () => {
  it('AC-13 yields "" when the recorded row\'s nested data.body is absent', () => {
    const row = recordedSingleRow();
    expect(row.data?.body).toBeTruthy();

    // The ONE toggle: drop the nested body every real captured row carries.
    const { data: _data, ...withoutData } = row;

    const mapped = mapReceivedEmail(asSentEmail(withoutData as WireEmail));

    expect(mapped.body).toBe("");
    expect(typeof mapped.body).toBe("string");
  });

  it('AC-13 yields "" when data is present but carries no body', () => {
    const withEmptyData = { ...recordedSingleRow(), data: {} };

    const mapped = mapReceivedEmail(asSentEmail(withEmptyData));

    expect(mapped.body).toBe("");
    expect(typeof mapped.body).toBe("string");
  });

  it("AC-13 still returns the real recorded body untouched when one is present", () => {
    const row = recordedSingleRow();

    const mapped = mapReceivedEmail(asSentEmail(row));

    expect(mapped.body).toBe(row.data?.body);
    expect(mapped.body.length).toBeGreaterThan(0);
  });
});
