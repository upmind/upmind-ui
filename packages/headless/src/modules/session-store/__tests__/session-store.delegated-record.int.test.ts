/**
 * @fileoverview Per-record delegation, read off real recorded API rows (integration)
 *
 * ## Job To Be Done
 * Drive `isDelegated` and `getOwnerForDelegatedRecord` against the ACTUAL
 * invoice rows staging returns to a delegate member: a server-flagged invoice
 * (`delegate_related`) is reported as delegated, and the owning client embedded
 * on that row (`client`) is resolved from the record itself.
 *
 * ## What Breaks If These Fail
 * A delegate sees no delegated badge on an invoice the server flagged (DG2), or
 * the owning client of a delegated record cannot be named (DG3) — the API's row
 * shape moved and the resolver no longer reads it.
 */

import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { isDelegated, getOwnerForDelegatedRecord } from "..";
import type { DelegatableRecord } from "..";
import type { IInvoice } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type InvoiceEnvelope = { data: IInvoice[] };

function flaggedInvoice(): IInvoice {
  const rows = getFixtureBody<InvoiceEnvelope>("get-invoices-case-delegated", {
    recordingsDir
  }).data;
  const row = rows.find(
    invoice =>
      (invoice as unknown as { delegate_related?: boolean })
        .delegate_related === true
  );
  if (!row)
    throw new Error("No delegate_related invoice in the recorded rows.");
  return row;
}

// -----------------------------------------------------------------------------

describe("per-record delegation, off real recorded rows", () => {
  it("reports a server-flagged invoice as delegated @AC-DG2", () => {
    expect(isDelegated(flaggedInvoice() as DelegatableRecord)).toBe(true);
  });

  it("resolves the owning client from a delegated record @AC-DG3", () => {
    const invoice = flaggedInvoice();
    const wireClient = (
      invoice as unknown as {
        client: { id: string; public_name: string };
      }
    ).client;

    const owner = getOwnerForDelegatedRecord(invoice as DelegatableRecord);

    expect(owner).toBeDefined();
    expect(owner?.id).toBe(wireClient.id);
    expect(owner?.publicName).toBe(wireClient.public_name);
  });
});
