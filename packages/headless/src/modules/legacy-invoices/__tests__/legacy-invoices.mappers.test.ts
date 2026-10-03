// -----------------------------------------------------------------------------
/**
 * @fileoverview legacy-invoices mappers — the projection SHAPE, both halves
 * kept (unit, AC-7; design.md §8.12, §8.13, decision D-16, ruling PROJ-1)
 *
 * ## Job To Be Done
 * The mapped record has TWO halves: the top-level fields the collection and
 * the manager both publish (`id`, `number`, `total_amount`, `create_datetime`,
 * `staged_import`), and the preserved bill kept WHOLE under `content` — no
 * flattened projection is minted here (D-16). This file asserts the SHAPE of
 * both halves over a REAL recorded row; the path-by-path detail of the
 * preserved bill's seventeen members is owned by the integration detail
 * specification (design.md §8.12), never repeated here.
 *
 * ## What Breaks If These Fail
 * Dropping either half silently loses either the list row's own fields or
 * the whole preserved bill FE-1902 renders from — the detail page would open
 * to nothing.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  mapLegacyInvoice,
  mapLegacyInvoices
} from "../legacy-invoices.mappers";
import type { ILegacyInvoice } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const envelope = getFixtureBody<{ data: ILegacyInvoice[] }>(
  "get-import-invoice-data",
  { recordingsDir }
);
const wireRow = envelope.data[0]!;

describe("legacy-invoices mappers — the top-level half (AC-7)", () => {
  it("maps the record's own top-level fields, unchanged from the wire", () => {
    const mapped = mapLegacyInvoice(wireRow);
    expect(mapped.id).toBe(wireRow.id);
    expect(mapped.number).toBe(wireRow.number);
    expect(mapped.total_amount).toBe(wireRow.total_amount);
    expect(mapped.total_amount_formatted).toBe(wireRow.total_amount_formatted);
    expect(mapped.create_datetime).toBe(wireRow.create_datetime);
    expect(mapped.staged_import).toBe(wireRow.staged_import);
  });
});

describe("legacy-invoices mappers — the preserved bill kept WHOLE (AC-7, D-16, PROJ-1)", () => {
  it("keeps the preserved bill reachable in full, with no flattened projection minted", () => {
    const mapped = mapLegacyInvoice(wireRow);
    expect(mapped.content).toEqual(wireRow.content);
  });

  it("does not itself derive any of the five conditions — content stays the sole path", () => {
    // The detail integration specification asserts each condition reads its
    // OWN path off `content` (design.md §8.13); this mapper unit test asserts
    // only that the path is reachable, per §8.12's ownership split.
    const mapped = mapLegacyInvoice(wireRow);
    expect(mapped.content).toHaveProperty("status");
    expect(mapped.content).toHaveProperty("partial_amount_credited_converted");
  });
});

describe("legacy-invoices mappers — the list projection (AC-2, AC-4)", () => {
  it("maps every row of the collection, in the wire's own order", () => {
    const mapped = mapLegacyInvoices(envelope.data);
    expect(mapped).toHaveLength(envelope.data.length);
    expect(mapped.map(row => row.id)).toEqual(envelope.data.map(row => row.id));
  });
});
