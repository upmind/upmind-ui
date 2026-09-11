// -----------------------------------------------------------------------------
/**
 * @module tests/product-settings-area
 * @description Gap doc §2 "Settings tab": where this product's billing is
 * pointed and who else may reach it — the client's own label, the card and
 * address pickers, the auto-renew controls and their suppressed form, and the
 * per-delegate grant.
 *
 * Every picker is graded on the same contract: the row standing for what is
 * ALREADY chosen is a statement, not a control, and every other row carries
 * the verb that would choose it. The grant is round-tripped through the
 * delegate's own facade, because a toggle that only reports back what it was
 * handed proves nothing.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  DelegateObjectTypes,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { boundRefId, rowBinding, stringsIn } from "./support/page-config";
import { assign, filter, find, map, reject, some } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockDataset,
  MockDelegate,
  MockProduct
} from "~/portal/mock/types";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { DATA_REF_ID, resolveDataRef } from "~/portal/mock/data-refs";
import { useMockDelegate } from "~/portal/mock/facades";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  productAddressItems,
  productAreaNavItems,
  productAutoRenewItems,
  productAutoRenewNotice,
  productDelegateAccessItems,
  productHasAutoRenewControls,
  productHasAutoRenewNotice,
  productHasUnpaidInvoices,
  productLabelFormModel
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_BILLING_TYPE } from "~/portal/mock/types";

const SETTINGS_PAGE = "product-area/settings";

const SETTINGS_NAV_LABEL = "settings";

const CURRENT_TAG = "Current";

const FULL_ACCESS_TAG = "Full access";

const UNPAID_DESTINATION = mockActionValue(
  MOCK_ACTION.NAVIGATE,
  "/billing/invoices?status=unpaid"
);

/** Legacy's "create one from here": the profile's own add-address form. */
const ADDRESS_BOOK_DESTINATION = mockActionValue(
  MOCK_ACTION.OPEN_FORM,
  FORM_ID.ADDRESS_CREATE
);

/** The invitation itself, now a form can answer it (plan F12). */
const DELEGATE_INVITE_DESTINATION = mockActionValue(
  MOCK_ACTION.OPEN_FORM,
  FORM_ID.DELEGATE_INVITE
);

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

/** A subscription with both renewal controls live — the picker panels' own subject. */
function managed(data: MockDataset): MockProduct {
  return seeded(
    data,
    "renewing subscription with a custom label",
    product =>
      product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION &&
      product.canDisableAutoRenew &&
      product.autoExpireAt === undefined &&
      product.customLabel !== undefined
  );
}

function settingsRow(refId: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID]) {
  const row = rowBinding(productPages()[SETTINGS_PAGE], refId);
  if (row === undefined) throw new Error(`no settings row binds ${refId}`);
  return row;
}

function tagLabels(row: { tags?: readonly { label: string }[] }): string[] {
  return map(row.tags ?? [], "label");
}

function delegateOf(data: MockDataset, delegateId: string): MockDelegate {
  const delegate = find(data.delegates, { id: delegateId });
  if (delegate === undefined) throw new Error(`no delegate ${delegateId}`);
  return delegate;
}

describe("the client's own label for the product", () => {
  it("opens the form on it verbatim, and on nothing where none was given", () => {
    const data = clone();
    const labelled = managed(data);
    const bare = seeded(
      data,
      "product with no custom label",
      product => product.customLabel === undefined
    );

    expect(productLabelFormModel(data, contextFor(labelled))["label"]).toBe(
      labelled.customLabel
    );
    expect(productLabelFormModel(data, contextFor(bare))["label"]).toBe("");
  });
});

describe("auto-renew — a switch where the brand allows one, a notice where it does not", () => {
  it("offers the switch on a product the client may stop", () => {
    const data = clone();
    const product = managed(data);

    const rows = productAutoRenewItems(data, contextFor(product));
    const toggle = find(rows, row => row.toggle !== undefined);

    expect(productHasAutoRenewControls(data, contextFor(product))).toBe(true);
    expect(productHasAutoRenewNotice(data, contextFor(product))).toBe(false);
    expect(toggle?.toggle?.value).toBe(
      mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id)
    );
    expect(toggle?.toggle?.checked).toBe(product.autoRenew);
  });

  it("replaces it with a stated reason where the brand has locked the renewal", () => {
    const data = clone();
    const locked = seeded(
      data,
      "product whose renewal the brand has locked",
      product => !product.canDisableAutoRenew
    );

    expect(productHasAutoRenewControls(data, contextFor(locked))).toBe(false);
    expect(productAutoRenewItems(data, contextFor(locked))).toEqual([]);
    expect(productHasAutoRenewNotice(data, contextFor(locked))).toBe(true);
    expect(productAutoRenewNotice(data, contextFor(locked))).toBeTruthy();
  });

  it("replaces it with a stated reason where the product is set to expire", () => {
    const data = clone();
    const expiring = seeded(
      data,
      "product set to expire",
      product => product.autoExpireAt !== undefined
    );

    expect(productHasAutoRenewControls(data, contextFor(expiring))).toBe(false);
    expect(productHasAutoRenewNotice(data, contextFor(expiring))).toBe(true);
    expect(productAutoRenewNotice(data, contextFor(expiring))).toBeTruthy();
  });

  it("offers to raise the renewal invoice only while the product will not renew itself", () => {
    const data = clone();
    const product = managed(data);
    const raiseValue = mockActionValue(
      MOCK_ACTION.CREATE_RENEWAL_INVOICE,
      product.id
    );
    assign(product, { autoRenew: true });

    const whileRenewing = stringsIn(
      productAutoRenewItems(data, contextFor(product))
    );
    assign(product, { autoRenew: false });
    const whileStopped = stringsIn(
      productAutoRenewItems(data, contextFor(product))
    );

    expect(whileRenewing).not.toContain(raiseValue);
    expect(whileStopped).toContain(raiseValue);
  });
});

describe("the unpaid-invoices notice stands only where this product owes something", () => {
  it("is gated on the product's own ledger and points at the unpaid listing", () => {
    const data = clone();
    const owing = seeded(
      data,
      "product with an unpaid invoice against it",
      product =>
        some(
          data.invoices,
          invoice =>
            invoice.productId === product.id &&
            InvoiceStatusGroups.UNPAID.includes(invoice.status)
        )
    );
    const clear = seeded(
      data,
      "product with nothing owed against it",
      product =>
        !some(
          data.invoices,
          invoice =>
            invoice.productId === product.id &&
            InvoiceStatusGroups.UNPAID.includes(invoice.status)
        )
    );
    const row = settingsRow(DATA_REF_ID.PRODUCT_HAS_UNPAID_INVOICES);

    expect(boundRefId(row, "visible")).toBe(
      DATA_REF_ID.PRODUCT_HAS_UNPAID_INVOICES
    );
    expect(stringsIn(row)).toContain(UNPAID_DESTINATION);
    expect(productHasUnpaidInvoices(data, contextFor(owing))).toBe(true);
    expect(productHasUnpaidInvoices(data, contextFor(clear))).toBe(false);
    expect(resolveDataRef(row.visible, data, contextFor(clear))).toBe(false);
  });
});

describe("the billing-address panel points this product at one address", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("lists the address book, offers each spare one, and links out to add another", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = managed(data);

    const rows = productAddressItems(data, contextFor(product));
    const known = filter(rows, row => some(data.addresses, { id: row.id }));
    const link = reject(rows, row => some(data.addresses, { id: row.id }));
    const offered = reject(known, row => tagLabels(row).includes(CURRENT_TAG));

    expect(map(known, "id")).toEqual(map(data.addresses, "id"));
    expect(link).toHaveLength(1);
    expect(stringsIn(link)).toContain(ADDRESS_BOOK_DESTINATION);
    for (const row of offered) {
      expect(row.action?.value).toBe(
        mockActionValue(
          MOCK_ACTION.SET_PRODUCT_BILLING_ADDRESS,
          `${product.id}:${row.id}`
        )
      );
    }
  });

  it("moves the product onto the chosen address", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = managed(data);
    const chosen = find(
      productAddressItems(data, contextFor(product)),
      row =>
        some(data.addresses, { id: row.id }) &&
        !tagLabels(row).includes(CURRENT_TAG)
    );
    if (chosen === undefined) throw new Error("no spare address to choose");

    const result = dispatchMockAction(
      data,
      contextFor(product),
      chosen.action?.value ?? ""
    );

    expect(product.billingAddressId).toBe(chosen.id);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});

describe("delegate access — who else may reach this one product", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("is one row per delegate: a statement for full access, a switch for the rest", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = managed(data);

    const rows = productDelegateAccessItems(data, contextFor(product));

    expect(map(rows, "id")).toEqual(map(data.delegates, "id"));
    for (const row of rows) {
      const delegate = delegateOf(data, row.id);
      if (delegate.isFullDelegate === true) {
        expect(tagLabels(row)).toContain(FULL_ACCESS_TAG);
        expect(row.toggle).toBeUndefined();
        continue;
      }
      expect(tagLabels(row)).not.toContain(FULL_ACCESS_TAG);
      expect(row.toggle?.value).toBe(
        mockActionValue(
          MOCK_ACTION.DELEGATE_TOGGLE_OBJECT,
          `${delegate.id}:${DelegateObjectTypes.CONTRACT_PRODUCT}:${product.id}`
        )
      );
      expect(row.toggle?.checked).toBe(
        find(delegate.objects, {
          type: DelegateObjectTypes.CONTRACT_PRODUCT,
          id: product.id
        }) !== undefined
      );
    }
    expect(some(data.delegates, { isFullDelegate: true })).toBe(true);
    expect(some(data.delegates, { isFullDelegate: false })).toBe(true);
  });

  it("grants then revokes through the delegate's own facade, toasting each way", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = managed(data);
    const rows = productDelegateAccessItems(data, contextFor(product));
    const ungranted = find(rows, row => row.toggle?.checked === false);
    if (ungranted === undefined) throw new Error("no ungranted delegate row");
    const holds = () =>
      find(
        useMockDelegate(data, ungranted.id).useContext().data.value?.objects ??
          [],
        {
          type: DelegateObjectTypes.CONTRACT_PRODUCT,
          id: product.id
        }
      ) !== undefined;

    const granted = dispatchMockAction(
      data,
      contextFor(product),
      ungranted.toggle?.value ?? ""
    );
    const afterGrant = holds();
    const revoked = dispatchMockAction(
      data,
      contextFor(product),
      ungranted.toggle?.value ?? ""
    );

    expect(afterGrant).toBe(true);
    expect(holds()).toBe(false);
    expect(granted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(revoked?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("heads the panel with the way to invite someone who is not on it yet", () => {
    const row = settingsRow(DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS);

    expect(stringsIn(row.header)).toContain(DELEGATE_INVITE_DESTINATION);
    expect(some(stringsIn(row.header), label => /invite/i.test(label))).toBe(
      true
    );
  });
});

describe("the area itself is offered only where the client may change anything", () => {
  it("is absent from the nav for a one-time purchase and for a delegated product", () => {
    const data = clone();
    const managedProduct = managed(data);
    const oneTime = seeded(
      data,
      "one-time product",
      product => product.billingType === MOCK_BILLING_TYPE.ONE_TIME
    );
    const labels = (product: MockProduct) =>
      map(productAreaNavItems(data, contextFor(product)), item =>
        item.label.toLowerCase()
      );

    expect(labels(managedProduct)).toContain(SETTINGS_NAV_LABEL);
    expect(labels(oneTime)).not.toContain(SETTINGS_NAV_LABEL);

    assign(managedProduct, { isDelegated: true });

    expect(labels(managedProduct)).not.toContain(SETTINGS_NAV_LABEL);
  });
});
