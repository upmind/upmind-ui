// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — pure mapper branches: the bundle grouping fallback
 * chain (AC-5) and the child-first attribution gate (AC-13)
 *
 * ## Job To Be Done
 * Two branches of this module's mapping logic are pure-function branches,
 * additionally proven at this layer per `docs/sdd/FE-3031/bdd.md` ("Two
 * behaviours are unit-shaped and are covered ADDITIONALLY, never INSTEAD"):
 *
 * - The bundle grouping's fallback chain — `contracts_product_id`, falling
 *   back to `contract_id`, with un-linked lines in one trailing `null`-keyed
 *   group (AC-5).
 * - The child-first attribution gate — `isDelegated` is false whenever
 *   `isChildOfClient` is true, regardless of input order (AC-13).
 *
 * Both also carry integration read-backs (`invoices.mapping.int.test.ts`,
 * `invoices.attribution.int.test.ts`) and negative controls — this unit spec
 * accompanies that proof and never constitutes it alone.
 *
 * ## Provenance
 * Every input is `recorded.unpaid()` — a REAL row captured from staging by
 * `invoices.fixtures.ts` — with an explicitly labelled minimal set of fields
 * toggled per call, the same precedent as
 * `client-email-history/__tests__/client-email-history.mappers.test.ts`.
 *
 * ## What Breaks If These Fail
 * A bundle's line items land in the wrong subscription group, an unlinked
 * line item is silently dropped instead of grouped, or a sub-account
 * invoice's delegated flag survives alongside its child flag and a client
 * is denied settling an invoice that IS theirs to settle.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapInvoice, mapInvoices } from "..";
import type { Envelope, WireInvoice } from "./invoices.int-helpers";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const recordedUnpaid = (): WireInvoice =>
  getFixtureBody<Envelope<WireInvoice>>("get-invoices-id-case-unpaid", {
    recordingsDir
  }).data;

// -----------------------------------------------------------------------------

describe("invoices — bundle grouping fallback chain (AC-5)", () => {
  it("groups by contracts_product_id when present, over contract_id", () => {
    const row = recordedUnpaid();
    const realProduct = row.products[0];
    const toggled: WireInvoice = {
      ...row,
      products: [
        {
          ...realProduct,
          id: "p1",
          contract_id: "c1",
          contracts_product_id: "cp1"
        },
        {
          ...realProduct,
          id: "p2",
          contract_id: "c1",
          contracts_product_id: "cp1"
        }
      ]
    };

    const mapped = mapInvoice(toggled as never);

    expect(mapped.bundle.groups).toHaveLength(1);
    expect(mapped.bundle.groups[0].contractsProductId).toBe("cp1");
    expect(mapped.bundle.groups[0].products.map(p => p.id)).toEqual([
      "p1",
      "p2"
    ]);
  });

  it("falls back to contract_id when contracts_product_id is absent", () => {
    const row = recordedUnpaid();
    const realProduct = row.products[0];
    const toggled: WireInvoice = {
      ...row,
      products: [
        {
          ...realProduct,
          id: "p1",
          contract_id: "c1",
          contracts_product_id: null
        }
      ]
    };

    const mapped = mapInvoice(toggled as never);

    expect(mapped.bundle.groups).toHaveLength(1);
    expect(mapped.bundle.groups[0].contractId).toBe("c1");
    expect(mapped.bundle.groups[0].contractsProductId).toBeNull();
  });

  it("lands an un-linked line item (both ids null) in one trailing null-keyed group, never dropped", () => {
    const row = recordedUnpaid();
    const realProduct = row.products[0];
    const toggled: WireInvoice = {
      ...row,
      products: [
        {
          ...realProduct,
          id: "p1",
          contract_id: "c1",
          contracts_product_id: "cp1"
        },
        {
          ...realProduct,
          id: "p2",
          contract_id: null,
          contracts_product_id: null
        },
        {
          ...realProduct,
          id: "p3",
          contract_id: null,
          contracts_product_id: null
        }
      ]
    };

    const mapped = mapInvoice(toggled as never);

    const unlinked = mapped.bundle.groups.find(
      group => group.contractId === null && group.contractsProductId === null
    );
    expect(unlinked).toBeDefined();
    expect(unlinked!.products.map(p => p.id)).toEqual(["p2", "p3"]);
    expect(
      mapped.bundle.groups.flatMap(group => group.products.map(p => p.id))
    ).toEqual(["p1", "p2", "p3"]);
  });
});

describe("invoices — the child-first attribution gate (AC-13)", () => {
  it("resolves isDelegated FALSE whenever isChildOfClient is true, even though delegate_related is also true", () => {
    const row = recordedUnpaid();
    const toggled: WireInvoice = {
      ...row,
      delegate_related: true,
      client: {
        ...row.client,
        id: "child-client",
        parent_client_config: { parent_client_id: "reading-client" }
      }
    };

    const mapped = mapInvoice(toggled as never, "reading-client" as never);

    expect(mapped.attribution.isChildOfClient).toBe(true);
    expect(mapped.attribution.isDelegated).toBe(false);
  });

  it("resolves isDelegated TRUE only when isChildOfClient is false", () => {
    const row = recordedUnpaid();
    const toggled: WireInvoice = {
      ...row,
      delegate_related: true,
      client: {
        ...row.client,
        id: "delegator-client",
        parent_client_config: null
      }
    };

    const mapped = mapInvoice(toggled as never, "reading-client" as never);

    expect(mapped.attribution.isChildOfClient).toBe(false);
    expect(mapped.attribution.isDelegated).toBe(true);
  });

  it("mapInvoices maps a co-mingled page, attributing each row independently", () => {
    const row = recordedUnpaid();
    const own = {
      ...row,
      id: "own-1",
      delegate_related: false,
      client: {
        ...row.client,
        id: "reading-client",
        parent_client_config: null
      }
    };
    const child = {
      ...row,
      id: "child-1",
      delegate_related: false,
      client: {
        ...row.client,
        id: "child-client",
        parent_client_config: { parent_client_id: "reading-client" }
      }
    };
    const delegated = {
      ...row,
      id: "delegated-1",
      delegate_related: true,
      client: {
        ...row.client,
        id: "delegator-client",
        parent_client_config: null
      }
    };

    const mapped = mapInvoices(
      [own, child, delegated] as never,
      "reading-client" as never
    );

    expect(mapped.map(invoice => invoice.attribution.isOwn)).toEqual([
      true,
      false,
      false
    ]);
    expect(mapped.map(invoice => invoice.attribution.isChildOfClient)).toEqual([
      false,
      true,
      false
    ]);
    expect(mapped.map(invoice => invoice.attribution.isDelegated)).toEqual([
      false,
      false,
      true
    ]);
  });
});
