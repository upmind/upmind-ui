/**
 * @fileoverview Per-record delegation edge cases (unit)
 *
 * ## Job To Be Done
 * `getOwnerForDelegatedRecord` reports no owner when a delegated record carries
 * no embedded owning client — read off a real recorded invoice row captured
 * without the `client` relation.
 *
 * ## What Breaks If These Fail
 * The delegated-owner tooltip renders a blank/broken owner instead of nothing
 * when the record has no owner attached.
 */

import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { getOwnerForDelegatedRecord } from "..";
import type { DelegatableRecord } from "..";
import type { IInvoice } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type InvoiceEnvelope = { data: IInvoice[] };

// -----------------------------------------------------------------------------

describe("getOwnerForDelegatedRecord — no owner attached", () => {
  it("reports no owner for a delegated record with no owning client embedded @AC-DG3", () => {
    const row = getFixtureBody<InvoiceEnvelope>("get-invoices-case-no-owner", {
      recordingsDir
    }).data[0];
    expect("client" in (row as object)).toBe(false);

    expect(
      getOwnerForDelegatedRecord(row as DelegatableRecord)
    ).toBeUndefined();
  });
});

// AC-DG2 child-account exclusion is NOT driven here: staging cannot produce a
// recorded row that is both delegation-flagged AND a child account (a client's
// own list does not co-mingle its sub-accounts — session-store.6.log). Kept
// @todo in the feature and handed to the operator.
