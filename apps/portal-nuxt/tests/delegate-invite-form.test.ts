// -----------------------------------------------------------------------------
/**
 * @module tests/delegate-invite-form
 * @description Gap doc §4 "Delegates" / plan §3 row "Invite delegate": the
 * invitation legacy's `clientDelegateInviteModal` sent, reachable from the two
 * places that ask for it — the account's own list and the panel that grants
 * one product (plan F12). What a specific invitation may name is a fact about
 * the account, so an account holding nothing to grant is offered no picker at
 * all; naming nothing while claiming to name something is the schema's refusal
 * (plan F5), and inviting somebody already invited is the facade's.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { DelegateObjectTypes } from "@upmind-automation/types";
import { rowBinding, stringsIn } from "./support/page-config";
import { assign, cloneDeep, filter, find, get, map, size } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProduct } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { DelegateAccessTypes } from "~/portal/mock/contracts/client-delegates";
import * as delegateSchemas from "~/portal/mock/contracts/client-delegates.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { delegateInviteContext } from "~/portal/mock/forms/account-contexts";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_DELEGATE_STATUS } from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const SETTINGS_PAGE = "product-area/settings";

const INVITEE = "rowan@fieldnotes.app";

const INVITE_CTA = mockActionValue(
  MOCK_ACTION.OPEN_FORM,
  FORM_ID.DELEGATE_INVITE
);

const DUPLICATE = MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.DUPLICATE_DELEGATE];

type RowLike = {
  readonly id: string;
  readonly description?: string;
  readonly toggle?: { readonly checked: boolean };
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function seededProduct(
  data: MockDataset,
  matches: (product: MockProduct) => boolean = () => true
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error("seed carries no product");
  return product;
}

/** An account holding nothing a specific invitation could name. */
function barren(data: MockDataset): MockDataset {
  return assign(cloneDeep(data), { products: [], tickets: [] });
}

function schemaFor(data: MockDataset) {
  return delegateSchemas.useSchema(delegateInviteContext(data));
}

function invite(model: unknown): string {
  return `${MOCK_ACTION.DELEGATE_INVITE}:${JSON.stringify(model)}`;
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

describe("the invitation is reachable from both places that ask for it", () => {
  it("heads the account's own list with it, and the panel that grants one product", () => {
    const listRow = rowBinding(
      accountPages()[PAGE_KEY.ACCOUNT_DELEGATES],
      DATA_REF_ID.ACCOUNT_DELEGATE_ITEMS
    );
    const panelRow = rowBinding(
      productPages()[SETTINGS_PAGE],
      DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS
    );

    expect(stringsIn(listRow?.header)).toContain(INVITE_CTA);
    expect(stringsIn(panelRow?.header)).toContain(INVITE_CTA);
  });

  it("opens on the schema module's own blank, addressed to nobody", () => {
    const data = hostgrid();

    const opened = dispatchMockAction(data, NO_CONTEXT, INVITE_CTA);
    expect(opened?.form).toEqual({ id: FORM_ID.DELEGATE_INVITE });

    const entry = resolveMockForm(data, FORM_ID.DELEGATE_INVITE, undefined);
    expect(entry?.model).toEqual(
      delegateSchemas.delegateInviteDefaults(delegateInviteContext(data))
    );
    expect(entry?.schema).toEqual(schemaFor(data));
    expect(entry?.submit).toBe(MOCK_ACTION.DELEGATE_INVITE);
  });
});

describe("what a specific invitation may name", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("insists on one grant while the invitation reaches only what it names", () => {
    const data = hostgrid();
    const validate = usePortalAjv().compile(schemaFor(data));
    const productId = seededProduct(data).id;
    const ticketId = data.tickets[0]?.id;

    expect(
      validate({
        email: INVITEE,
        accessType: DelegateAccessTypes.FULL,
        productIds: [],
        ticketIds: []
      })
    ).toBe(true);
    expect(
      validate({
        email: INVITEE,
        accessType: DelegateAccessTypes.SPECIFIC,
        productIds: [productId],
        ticketIds: []
      })
    ).toBe(true);
    expect(
      validate({
        email: INVITEE,
        accessType: DelegateAccessTypes.SPECIFIC,
        productIds: [],
        ticketIds: [ticketId]
      })
    ).toBe(true);
    expect(
      validate({
        email: INVITEE,
        accessType: DelegateAccessTypes.SPECIFIC,
        productIds: [],
        ticketIds: []
      })
    ).toBe(false);
  });

  it("offers no picker, and no choice, to an account holding nothing to grant", () => {
    const data = hostgrid();
    const empty = barren(data);

    expect(size(delegateInviteContext(empty).products)).toBe(0);
    expect(size(delegateInviteContext(empty).tickets)).toBe(0);
    expect(get(schemaFor(data), "properties.productIds")).toBeDefined();
    expect(get(schemaFor(data), "properties.ticketIds")).toBeDefined();
    expect(get(schemaFor(empty), "properties.productIds")).toBeUndefined();
    expect(get(schemaFor(empty), "properties.ticketIds")).toBeUndefined();
    expect(get(schemaFor(empty), "properties.accessType")).toBeUndefined();
    expect(
      map(
        delegateSchemas.useUischema(delegateInviteContext(empty)).elements,
        "scope"
      )
    ).toEqual(["#/properties/email"]);
  });
});

describe("sending one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("appends a pending delegate holding exactly what was named", () => {
    const data = hostgrid();
    const before = data.delegates.length;
    const product = seededProduct(data);
    const ticket = data.tickets[0];

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      invite({
        email: INVITEE,
        accessType: DelegateAccessTypes.SPECIFIC,
        productIds: [product.id],
        ticketIds: [ticket?.id]
      })
    );

    const invited = find(data.delegates, { email: INVITEE });
    expect(data.delegates.length).toBe(before + 1);
    expect(invited?.status).toBe(MOCK_DELEGATE_STATUS.PENDING);
    expect(invited?.isFullDelegate).toBe(false);
    expect(invited?.objects).toHaveLength(2);
    expect(invited?.objects).toEqual(
      expect.arrayContaining([
        { type: DelegateObjectTypes.CONTRACT_PRODUCT, id: product.id },
        { type: DelegateObjectTypes.TICKET, id: ticket?.id }
      ])
    );
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain(INVITEE);
  });

  it("names nothing on an invitation that reaches everything", () => {
    const data = hostgrid();

    dispatchMockAction(
      data,
      NO_CONTEXT,
      invite({
        email: INVITEE,
        accessType: DelegateAccessTypes.FULL,
        productIds: [],
        ticketIds: []
      })
    );

    const invited = find(data.delegates, { email: INVITEE });
    expect(invited?.isFullDelegate).toBe(true);
    expect(invited?.objects).toEqual([]);
  });

  it("refuses somebody this account has already invited", () => {
    const data = hostgrid();
    const seeded = data.delegates[0];
    const before = cloneDeep(data.delegates);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      invite({
        email: seeded?.email,
        accessType: DelegateAccessTypes.FULL,
        productIds: [],
        ticketIds: []
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(result ?? {})).toContain(DUPLICATE);
    expect(data.delegates).toEqual(before);
  });

  it("stands on the granted product's own panel, holding that grant", () => {
    const data = hostgrid();
    const product = seededProduct(data);
    const other = seededProduct(data, item => item.id !== product.id);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      invite({
        email: INVITEE,
        accessType: DelegateAccessTypes.SPECIFIC,
        productIds: [product.id],
        ticketIds: []
      })
    );

    const invited = find(data.delegates, { email: INVITEE });
    const granted = filter(
      ref<RowLike[]>(
        data,
        DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS,
        contextFor(product)
      ),
      { id: invited?.id }
    );
    const elsewhere = filter(
      ref<RowLike[]>(
        data,
        DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS,
        contextFor(other)
      ),
      { id: invited?.id }
    );

    expect(granted).toHaveLength(1);
    expect(granted[0]?.description).toBe(INVITEE);
    expect(granted[0]?.toggle?.checked).toBe(true);
    expect(elsewhere[0]?.toggle?.checked).toBe(false);
  });
});
