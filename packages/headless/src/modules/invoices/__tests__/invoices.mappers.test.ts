// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — pure mapper unit tests: identity/summary/payment
 * shape, the bundle grouping fallback chain (AC-5), and the child-first
 * attribution gate (AC-13)
 *
 * ## Job To Be Done
 * Pin `mapInvoice`/`mapInvoices`' pure transform from the raw platform
 * invoice record to the customer-facing shape:
 *
 * - Identity + money summary carry across, the embedded (frozen) client
 *   survives, an absent address maps to none, and each payment row resolves
 *   its pending/successful meaning, its card details, and its order.
 * - The bundle grouping's fallback chain — `contracts_product_id`, falling
 *   back to `contract_id`, with un-linked lines in one trailing `null`-keyed
 *   group (AC-5).
 * - The child-first attribution gate — `isDelegated` is false whenever
 *   `isChildOfClient` is true, regardless of input order (AC-13).
 *
 * The bundle-grouping and attribution branches also carry integration
 * read-backs (`invoices.mapping.int.test.ts`, `invoices.attribution.int.test.ts`)
 * and negative controls — this unit spec accompanies that proof and never
 * constitutes it alone, per `docs/sdd/FE-3031/bdd.md` ("Two behaviours are
 * unit-shaped and are covered ADDITIONALLY, never INSTEAD").
 *
 * ## Provenance
 * Every input is a REAL row captured from staging by `invoices.fixtures.ts`
 * (`get-invoices-id-case-{paid,unpaid}`), with an explicitly labelled minimal
 * set of fields toggled per call where a condition the real corpus doesn't
 * carry is needed — the same precedent as
 * `client-email-history/__tests__/client-email-history.mappers.test.ts`.
 * One such CONSTRUCTED case: the recorded paid row's own payment now happens
 * to carry a saved card, so the "no saved card" scenario overrides
 * `payment_details: null` on that same real row rather than being dropped.
 *
 * ## What Breaks If These Fail
 * A bundle's line items land in the wrong subscription group, an unlinked
 * line item is silently dropped instead of grouped, a sub-account invoice's
 * delegated flag survives alongside its child flag and a client is denied
 * settling an invoice that IS theirs to settle, the customer panel shows a
 * wrong balance or a stale client, or it crashes on a wallet/guest payment
 * with no saved card.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapInvoice, mapInvoices } from "..";
import billingCyclesRecording from "../../system/__tests__/fixtures/get-billing-cycles.json";
import { mapInvoiceItems } from "../invoices.mappers";
import itemsRecording from "./scenarios/read-the-items-of-one-of-my-orders/02/get-invoices-id-with-staged-imports-1.json";
import { map } from "lodash-es";
import type { Envelope, WireInvoice } from "./invoices.int-helpers";
import type {
  IBillingCycle,
  IInvoice,
  IPayment
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const recordedUnpaid = (): WireInvoice =>
  getFixtureBody<Envelope<WireInvoice>>("get-invoices-id-case-unpaid", {
    recordingsDir
  }).data;

function rawInvoice(kase: "paid" | "unpaid"): IInvoice {
  const body = getFixtureBody<{ data: IInvoice }>(
    `get-invoices-id-case-${kase}`,
    {
      recordingsDir
    }
  );
  if (!body?.data) {
    throw new Error(
      `Missing fixture get-invoices-id-case-${kase}. Run \`pnpm fixtures:generate invoices\`.`
    );
  }
  return body.data;
}

const paidRaw = rawInvoice("paid");
const unpaidRaw = rawInvoice("unpaid");

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

describe("invoices — category label precedence (AC-7)", () => {
  it("labels a consolidation credit note as a consolidation, never a plain credit note", () => {
    const row = recordedUnpaid();
    const toggled: WireInvoice = {
      ...row,
      is_consolidation: true,
      category: { ...row.category, slug: "credit_note" }
    };

    const mapped = mapInvoice(toggled as never);

    expect(mapped.category.label).toBe("consolidation");
  });

  it("labels a non-consolidation invoice by its own category slug", () => {
    const row = recordedUnpaid();
    const toggled: WireInvoice = {
      ...row,
      is_consolidation: false,
      category: { ...row.category, slug: "credit_note" }
    };

    const mapped = mapInvoice(toggled as never);

    expect(mapped.category.label).toBe("credit_note");
  });
});

// -----------------------------------------------------------------------------

describe("mapInvoice — identity, status, and money summary", () => {
  it("carries identity and the money summary from the raw record", () => {
    const mapped = mapInvoice(paidRaw);

    expect(mapped.id).toBe(paidRaw.id);
    expect(mapped.number).toBe(paidRaw.number);
    expect(mapped.status).toBe(
      (paidRaw.status as unknown as { code: string }).code
    );
    expect(typeof mapped.summary.paidAmount).toBe("number");
    expect(typeof mapped.summary.unpaidAmount).toBe("number");
    expect(mapped.currency).toBeTruthy();
  });

  it("maps the line items and the tax summary of an unpaid invoice", () => {
    const mapped = mapInvoice(unpaidRaw);

    expect(mapped.products.length).toBeGreaterThan(0);
    expect(mapped.summary.unpaidAmount).toBeGreaterThan(0);
  });
});

describe("mapInvoice — the pay currency (currencyPayment)", () => {
  it("falls back currencyPayment to the invoice's own currency when the raw row carries no payment_currency", () => {
    // The recorded unpaid row carries payment_currency: null — the real shape
    // of the fallback premise; a re-recording that adds one breaks this guard
    // loudly rather than passing the assertion below for the wrong reason.
    expect(
      (unpaidRaw as { payment_currency?: unknown }).payment_currency
    ).toBeFalsy();

    const mapped = mapInvoice(unpaidRaw);

    expect(mapped.currency).toBeTruthy();
    expect(mapped.currencyPayment).toStrictEqual(mapped.currency);
  });
});

describe("mapInvoice — the frozen client snapshot", () => {
  it("keeps the client embedded on the record, not a live join", () => {
    const mapped = mapInvoice(paidRaw);

    expect(mapped.client).toBeTruthy();
    expect(mapped.client.id).toBe(paidRaw.client.id);
  });
});

describe("mapInvoice — optional address", () => {
  it("maps to no address when the record carries none", () => {
    const withoutAddress = { ...paidRaw, address: null } as IInvoice;
    expect(mapInvoice(withoutAddress).address).toBeUndefined();
  });

  it("maps an address when the record carries one", () => {
    const address = {
      id: "addr-1",
      client_id: "client-1",
      address_1: "10 Downing Street",
      city: "London",
      postcode: "SW1A 2AA"
    } as unknown as IInvoice["address"];
    const mapped = mapInvoice({ ...paidRaw, address } as IInvoice);

    expect(mapped.address).toBeDefined();
  });
});

describe("mapPayments (via mapInvoice) — payment meaning and order", () => {
  const realPayment = paidRaw.payments[0];

  it("marks a captured, non-pending payment successful", () => {
    const mapped = mapInvoice(paidRaw);

    expect(mapped.payments.length).toBeGreaterThan(0);
    expect(mapped.payments[0].meta.isSuccessful).toBe(true);
    expect(mapped.payments[0].meta.isPending).toBe(false);
  });

  it("marks a pending payment pending and not successful", () => {
    const pending: IPayment = {
      ...realPayment,
      pending: true,
      captured: 0
    };
    const raw = { ...paidRaw, payments: [pending] } as IInvoice;

    expect(mapInvoice(raw).payments[0].meta).toStrictEqual({
      isPending: true,
      isSuccessful: false
    });
  });

  it("resolves card details when a saved card funded the payment", () => {
    const withCard: IPayment = {
      ...realPayment,
      payment_details: {
        ...(realPayment.payment_details as object),
        card_type: "visa",
        card_last4: "4242"
      } as IPayment["payment_details"]
    };
    const raw = { ...paidRaw, payments: [withCard] } as IInvoice;
    const mapped = mapInvoice(raw).payments[0];

    expect(mapped.cardType).toBe("visa");
    expect(mapped.cardLast4).toBe("4242");
  });

  it("carries no card details for a constructed payment with no saved card", () => {
    // Constructed: the currently recorded paid row's own payment now carries
    // a saved card (payment_details.card_type/card_last4), so this override
    // reconstructs the "no saved card" premise on the real recorded row —
    // same precedent as the "pending payment" override above.
    const withoutCard = {
      ...realPayment,
      payment_details: null
    } as unknown as IPayment;
    const raw = { ...paidRaw, payments: [withoutCard] } as IInvoice;
    const mapped = mapInvoice(raw).payments[0];

    expect(mapped.cardType == null || mapped.cardType === undefined).toBe(true);
  });

  it("orders payments newest first", () => {
    const older: IPayment = {
      ...realPayment,
      id: "older",
      created_at: "2020-01-01 00:00:00"
    };
    const newer: IPayment = {
      ...realPayment,
      id: "newer",
      created_at: "2024-12-31 23:59:59"
    };
    const raw = { ...paidRaw, payments: [older, newer] } as IInvoice;

    expect(mapInvoice(raw).payments.map(p => p.id)).toStrictEqual([
      "newer",
      "older"
    ]);
  });

  it("maps to an empty list when the invoice has no payments", () => {
    const raw = { ...paidRaw, payments: [] } as IInvoice;
    expect(mapInvoice(raw).payments).toStrictEqual([]);
  });
});

describe("invoices — AC-4 the invoice's own assigned payment method, read half", () => {
  it("carries the assigned method's id and card details off the real recorded row", () => {
    const assigned = paidRaw.payment_details;
    // Guards the toggle below against a re-recording that drops the card: an
    // assertion built on an absent field would pass for the wrong reason.
    expect(assigned?.card_type).toBeTruthy();

    expect(mapInvoice(paidRaw).paymentMethod).toStrictEqual({
      id: assigned!.id,
      cardType: assigned!.card_type,
      cardLast4: assigned!.card_last4,
      label: `${assigned!.card_type} ****${assigned!.card_last4}`
    });
  });

  it("reads 'None selected' as a first-class state, never a partly-filled method", () => {
    // The recorded unpaid row carries no assigned method — the real shape of
    // AC-4's 'None selected', not a constructed one.
    expect(unpaidRaw.payment_details).toBeFalsy();

    expect(mapInvoice(unpaidRaw).paymentMethod).toStrictEqual({
      id: null,
      cardType: null,
      cardLast4: null,
      label: ""
    });
  });

  it("draws no label for a method carrying no card, rather than a stray '****'", () => {
    const raw = {
      ...paidRaw,
      payment_details: {
        ...paidRaw.payment_details,
        card_type: null,
        card_last4: null
      }
    } as IInvoice;

    const method = mapInvoice(raw).paymentMethod;
    expect(method.id).toBe(paidRaw.payment_details!.id);
    expect(method.label).toBe("");
  });

  it("is the INVOICE's assigned method, not the card a payment happens to carry", () => {
    // Both records are called `payment_details` on the wire and are mapped by
    // different readers; a reader crossing them would report a payment's card
    // as the invoice's standing assignment.
    const raw = { ...paidRaw, payment_details: null } as IInvoice;

    expect(raw.payments?.[0]?.payment_details).toBeTruthy();
    expect(mapInvoice(raw).paymentMethod.id).toBeNull();
  });
});

describe("mapInvoice — the platform's translated status name (statusName)", () => {
  it("carries the status record's own translated name, not its code", () => {
    const status = paidRaw.status as unknown as { code: string; name: string };
    expect(status.name).toBe("Paid");
    expect(status.name).not.toBe(mapInvoice(paidRaw).status);

    expect(mapInvoice(paidRaw).statusName).toBe("Paid");
  });

  it("carries the unpaid status name off its own recorded row", () => {
    expect((unpaidRaw.status as unknown as { name: string }).name).toBe(
      "Unpaid"
    );

    expect(mapInvoice(unpaidRaw).statusName).toBe("Unpaid");
  });
});

describe("mapPayments (via mapInvoice) — the paying method's own label", () => {
  const realPayment = paidRaw.payments[0];

  it("reads the payment detail's own name as the label", () => {
    expect(realPayment.payment_details?.name).toBe("Visa ending 4242");

    expect(mapInvoice(paidRaw).payments[0].label).toBe("Visa ending 4242");
  });

  it("falls back to the card type and last four when the detail carries no name", () => {
    const withCardOnly: IPayment = {
      ...realPayment,
      payment_details: {
        ...(realPayment.payment_details as object),
        name: null,
        card_type: "visa",
        card_last4: "4242"
      } as IPayment["payment_details"]
    };
    const raw = { ...paidRaw, payments: [withCardOnly] } as IInvoice;
    const label = mapInvoice(raw).payments[0].label;

    expect(label).not.toBe("");
    expect(label).toContain("4242");
    expect(label.toLowerCase()).toContain("visa");
  });

  it("draws no label when the payment carries no detail at all", () => {
    const withoutDetail = {
      ...realPayment,
      payment_details: null
    } as unknown as IPayment;
    const raw = { ...paidRaw, payments: [withoutDetail] } as IInvoice;

    expect(mapInvoice(raw).payments[0].label).toBe("");
  });
});

// -----------------------------------------------------------------------------

/** The recorded order whose snapshot disagrees with its live items on the term. */
const recordedOrder = (
  itemsRecording as unknown as { response: { body: { data: IInvoice } } }
).response.body.data;

const billingCycles = (
  billingCyclesRecording as unknown as {
    response: { body: { data: IBillingCycle[] } };
  }
).response.body.data;

type RecordedItem = {
  id: string;
  billing_cycle_months: number;
  options?: unknown[];
  product: { billing_cycle_months: number };
};

const snapshotOf = (raw: IInvoice): RecordedItem[] =>
  (
    raw as unknown as {
      current_data: { content: { products: RecordedItem[] } };
    }
  ).current_data.content.products;

const liveOf = (raw: IInvoice): RecordedItem[] =>
  (raw as unknown as { products: RecordedItem[] }).products;

// FE-3237 AC15
describe("invoices — AC-32: the items of an order", () => {
  it("reads the items from the snapshot first, with the snapshot's own term", () => {
    const items = mapInvoiceItems(recordedOrder, {
      billingCycles,
      imageMap: {}
    });
    expect(map(items, item => item.id)).toEqual(
      map(snapshotOf(recordedOrder), item => item.id)
    );
    expect(map(items, item => item.billingCycleMonths)).toEqual([12, 24]);
    expect(map(items, item => item.billingCycle?.name)).toEqual([
      "Annually",
      "Biennially"
    ]);
  });

  it("falls back to the live items when the order has no snapshot", () => {
    const raw = { ...recordedOrder, current_data: null } as unknown as IInvoice;
    const items = mapInvoiceItems(raw, { billingCycles, imageMap: {} });
    expect(map(items, item => item.id)).toEqual(
      map(liveOf(recordedOrder), item => item.id)
    );
    expect(items[1].period).toBeDefined();
  });

  it("takes the product term when an item's own term is zero", () => {
    const raw = { ...recordedOrder, current_data: null } as unknown as IInvoice;
    const [zeroTerm] = liveOf(recordedOrder);
    expect(zeroTerm.billing_cycle_months).toBe(0);
    const [item] = mapInvoiceItems(raw, { billingCycles, imageMap: {} });
    expect(item.billingCycleMonths).toBe(zeroTerm.product.billing_cycle_months);
    expect(item.isSubscription).toBe(true);
  });

  it("gives no item, and no live fallback, for an empty snapshot", () => {
    const raw = {
      ...recordedOrder,
      current_data: { content: { products: [] } }
    } as unknown as IInvoice;
    expect(mapInvoiceItems(raw, { billingCycles, imageMap: {} })).toEqual([]);
  });

  it("maps a thin record to no item rather than failing", () => {
    expect(
      mapInvoiceItems({ id: recordedOrder.id } as IInvoice, {
        billingCycles,
        imageMap: {}
      })
    ).toEqual([]);
  });

  it("marks the item that carries options as one with sub-items", () => {
    const items = mapInvoiceItems(recordedOrder, {
      billingCycles,
      imageMap: {}
    });
    expect(map(items, item => item.hasSubItems)).toEqual(
      map(snapshotOf(recordedOrder), item => (item.options ?? []).length > 0)
    );
  });
});
