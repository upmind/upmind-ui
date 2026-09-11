// -----------------------------------------------------------------------------
/**
 * @module tests/product-billing-area
 * @description Gap doc §2 "Billing tab": what the area REPORTS, as distinct
 * from what it lets a client do — the line-item breakdown, the two standing
 * banners, the automation timeline, and the consolidation preference.
 *
 * The timeline's gates are graded by GRAFTING a seeded product's own
 * scheduled actions onto a one-time product and onto an auto-expiring trial:
 * both hide the timeline today only because they carry no events, so a gate
 * that never fired would read green against the seed alone.
 *
 * The area also carries a standing law about the cancellation request: it is
 * asked for by OPENING the registered form and never by a `cancel`-prefixed
 * verb of the area's own (plan F2, F12). That is graded on the config and on
 * the manage band, because a CTA is a config fact.
 */

import { describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  InvoiceConsolidationTypes,
  ScheduledActionStatusTypes
} from "@upmind-automation/types";
import {
  boundRefId,
  propsBinding,
  rowBinding,
  stringsIn
} from "./support/page-config";
import { assign, filter, find, get, map, some, values } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProduct } from "~/portal/mock/types";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { useConsolidationSchema } from "~/portal/mock/contracts/client-contract-product.schemas";
import { DATA_REF_ID, resolveDataRef } from "~/portal/mock/data-refs";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  productAcceptedCancellationMessage,
  productHasAcceptedCancellation,
  productHasPendingProRata,
  productHasTimeline,
  productLineItemSpecItems,
  productManageActions,
  productTimelineItems
} from "~/portal/mock/selectors";
import {
  SCHEDULED_ACTION_STATUS_LABEL,
  SCHEDULED_ACTION_STATUS_TONE
} from "~/portal/mock/status-labels";
import { MOCK_BILLING_TYPE } from "~/portal/mock/types";

/** An emitted action value is lowercase kebab; prose that merely starts with the word is not. */
const CANCEL_VERB = /^cancel[a-z-]*(:|$)/;

const BILLING_PAGE = "product-area/billing";

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function seeded(
  data: MockDataset,
  trait: string,
  matches: (product: MockProduct) => boolean
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error(`seed carries no ${trait}`);
  return product;
}

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function withTimeline(data: MockDataset): MockProduct {
  return seeded(
    data,
    "product with scheduled actions",
    product => product.scheduledActions.length > 0
  );
}

function billingRow(refId: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID]) {
  const row = rowBinding(productPages()[BILLING_PAGE], refId);
  if (row === undefined) throw new Error(`no billing row binds ${refId}`);
  return row;
}

describe("line items — what the configured product actually charges for", () => {
  it("renders one row per seeded line, in order, at that line's own amount", () => {
    const data = clone();
    const product = seeded(
      data,
      "product with more than one line item",
      candidate => candidate.lineItems.length > 1
    );

    const rows = productLineItemSpecItems(data, contextFor(product));

    expect(map(rows, "label")).toEqual(map(product.lineItems, "description"));
    expect(map(rows, "value")).toEqual(
      map(product.lineItems, line => line.amount.formatted)
    );
  });
});

describe("the accepted-cancellation banner reports, and offers nothing", () => {
  it("names the day it was asked for, the day it was accepted, and the reason", () => {
    const data = clone();
    const product = seeded(
      data,
      "product with an accepted cancellation",
      candidate =>
        candidate.cancellationRequest?.status ===
        CancellationRequestStatusCodes.REQUEST_ACCEPTED
    );
    const request = product.cancellationRequest;

    const message = productAcceptedCancellationMessage(
      data,
      contextFor(product)
    );

    expect(productHasAcceptedCancellation(data, contextFor(product))).toBe(
      true
    );
    expect(message).toContain(request?.requestedAt);
    expect(message).toContain(request?.acceptedAt);
    expect(message).toContain(request?.reason);
  });

  it("puts no control on that banner, and no control in the manage band either", () => {
    const data = clone();
    const product = seeded(
      data,
      "product with an accepted cancellation",
      candidate =>
        candidate.cancellationRequest?.status ===
        CancellationRequestStatusCodes.REQUEST_ACCEPTED
    );
    const props = propsBinding(
      productPages()[BILLING_PAGE],
      DATA_REF_ID.PRODUCT_ACCEPTED_CANCELLATION_MESSAGE
    );

    expect(props?.message).toBeDefined();
    expect(props?.action).toBeUndefined();
    expect(productManageActions(data, contextFor(product))).toEqual([]);
  });

  it("hides the banner for a product with a merely lodged cancellation", () => {
    const data = clone();
    const lodged = seeded(
      data,
      "product with a cancellation still only lodged",
      candidate =>
        candidate.cancellationRequest !== undefined &&
        candidate.cancellationRequest.status !==
          CancellationRequestStatusCodes.REQUEST_ACCEPTED
    );

    expect(productHasAcceptedCancellation(data, contextFor(lodged))).toBe(
      false
    );
    expect(productAcceptedCancellationMessage(data, contextFor(lodged))).toBe(
      ""
    );
  });
});

describe("the pro-rata warning stands only while an adjustment is landing", () => {
  it("is gated on the product's own flag, both ways, across the whole seed", () => {
    const data = clone();
    const row = billingRow(DATA_REF_ID.PRODUCT_HAS_PENDING_PRO_RATA);

    expect(boundRefId(row, "visible")).toBe(
      DATA_REF_ID.PRODUCT_HAS_PENDING_PRO_RATA
    );
    for (const product of data.products) {
      expect(productHasPendingProRata(data, contextFor(product))).toBe(
        product.pendingProRata
      );
    }
    expect(some(data.products, "pendingProRata")).toBe(true);
    expect(some(data.products, product => !product.pendingProRata)).toBe(true);
  });
});

describe("the automation timeline is the product's own scheduled actions", () => {
  it("renders one event per action, dated and labelled by its wire status", () => {
    const data = clone();
    const product = withTimeline(data);

    const items = productTimelineItems(data, contextFor(product));

    // The rail now merges the product's own lifecycle into these rows (plan
    // F17 O-2, graded in tests/thirteenth-closure.test.ts), so each queued
    // action is read by its own id rather than by its place in the list.
    for (const action of product.scheduledActions) {
      expect(find(items, { id: action.id })).toEqual(
        expect.objectContaining({
          title: action.label,
          datetime: action.scheduledAt,
          description: SCHEDULED_ACTION_STATUS_LABEL[action.status]
        })
      );
    }
    expect(map(product.scheduledActions, "id")).not.toEqual([]);
    expect(map(items, "datetime")).toEqual([...map(items, "datetime")].sort());
  });

  it("tells what is coming from what has happened from what was called off", () => {
    const data = clone();
    const source = withTimeline(data);
    const first = source.scheduledActions[0];
    if (first === undefined) throw new Error("no scheduled action to vary");
    const statuses = [
      ScheduledActionStatusTypes.STATUS_SCHEDULED,
      ScheduledActionStatusTypes.STATUS_EXECUTED,
      ScheduledActionStatusTypes.STATUS_CANCELLED
    ];
    assign(source, {
      scheduledActions: map(statuses, (status, index) =>
        assign({}, first, { id: `sa-varied-${index}`, status })
      )
    });

    const items = productTimelineItems(data, contextFor(source));
    const tones = map(source.scheduledActions, action =>
      get(find(items, { id: action.id }), "tone")
    );

    expect(tones).toEqual(
      map(statuses, status => SCHEDULED_ACTION_STATUS_TONE[status])
    );
    expect(new Set(tones).size).toBe(statuses.length);
  });

  it("hands the client legacy's timeline links as actions", () => {
    const data = clone();
    const product = withTimeline(data);
    assign(product, { autoRenew: false, autoExpireAt: "2999-01-01" });
    const items = productTimelineItems(data, contextFor(product));
    const actionOf = (id: string) => get(find(items, { id }), "action");
    expect(actionOf("next-invoice")).toEqual({
      value: mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, product.id),
      label: expect.stringMatching(/invoice/)
    });
    expect(actionOf("auto-renew-off")).toEqual({
      value: mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id),
      label: "Turn on auto-renew"
    });
    expect(actionOf("terminated")).toEqual({
      value: mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, product.id),
      label: "Don't cancel"
    });
    expect(actionOf("renewal")).toBeUndefined();
  });

  it("stays off a one-time purchase even when events stand against it", () => {
    const data = clone();
    const events = withTimeline(data).scheduledActions;
    const oneTime = seeded(
      data,
      "one-time product",
      product => product.billingType === MOCK_BILLING_TYPE.ONE_TIME
    );
    assign(oneTime, { scheduledActions: events });
    const visible = billingRow(DATA_REF_ID.PRODUCT_TIMELINE_ITEMS).visible;

    expect(productHasTimeline(data, contextFor(oneTime))).toBe(false);
    expect(resolveDataRef(visible, data, contextFor(oneTime))).toBe(false);
  });

  it("stays off a trial that simply expires, even when events stand against it", () => {
    const data = clone();
    const events = withTimeline(data).scheduledActions;
    const expiring = seeded(
      data,
      "trial set to expire",
      product =>
        product.autoExpireAt !== undefined && product.trialEndsAt !== undefined
    );
    assign(expiring, { scheduledActions: events });
    const visible = billingRow(DATA_REF_ID.PRODUCT_TIMELINE_ITEMS).visible;

    expect(productHasTimeline(data, contextFor(expiring))).toBe(false);
    expect(resolveDataRef(visible, data, contextFor(expiring))).toBe(false);
  });

  it("is gated on that same fact in the page config", () => {
    const data = clone();
    const row = billingRow(DATA_REF_ID.PRODUCT_TIMELINE_ITEMS);

    expect(boundRefId(row, "visible")).toBe(DATA_REF_ID.PRODUCT_HAS_TIMELINE);
    expect(
      resolveDataRef(row.visible, data, contextFor(withTimeline(data)))
    ).toBe(true);
  });
});

describe("the consolidation preference reads as the platform's own three states", () => {
  it("words each of them from the wire enum, never from a hardcoded string", () => {
    const states = values(InvoiceConsolidationTypes).filter(
      value => typeof value === "number"
    );
    const property =
      useConsolidationSchema().properties?.["invoiceConsolidation"];
    // `options` is a renderer extension, not a core schema keyword, so it is
    // read off the property rather than declared on `JsonSchema7`.
    const choices = get(property, "options", []);

    expect(property?.enum).toEqual(states);
    expect(map(choices, "value")).toEqual(states);

    const worded = map(choices, "label");
    expect(worded).toHaveLength(states.length);
    expect(new Set(worded).size).toBe(states.length);
    expect(some(worded, label => label === "")).toBe(false);
  });
});

describe("the request for a cancellation lives behind the registered form", () => {
  it("the composition itself still authors no cancel-prefixed action value", () => {
    const authored = filter(stringsIn(productPages()[BILLING_PAGE]), value =>
      CANCEL_VERB.test(value)
    );

    expect(authored).toEqual([]);
  });

  it("the manage band asks for one only by opening that form, never by its own verb", () => {
    const data = clone();
    const offered = map(data.products, product =>
      map(productManageActions(data, contextFor(product)), "value")
    ).flat();
    const opens = filter(offered, value =>
      value.startsWith(
        `${MOCK_ACTION.OPEN_FORM}:${FORM_ID.PRODUCT_CANCEL_REQUEST}:`
      )
    );

    expect(filter(offered, value => CANCEL_VERB.test(value))).toEqual([]);
    expect(opens.length).toBeGreaterThan(0);
    for (const value of opens) {
      expect(dispatchMockAction(data, {}, value)?.form?.id).toBe(
        FORM_ID.PRODUCT_CANCEL_REQUEST
      );
    }
  });
});
