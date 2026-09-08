// -----------------------------------------------------------------------------
/**
 * @module tests/product-migration
 * @description Gap doc §2 "Billing tab" (X6): upgrade / downgrade — the
 * manage band's own control, the picker it points at, and the swap the chosen
 * row performs.
 *
 * Whether the control is OFFERED and whether it is USABLE are two different
 * facts, so each is graded differentially: one seeded product carries every
 * precondition and a clone drops exactly one of them, which is what catches a
 * band that offers the control unconditionally or disables it for the wrong
 * reason. The seed alone cannot do this — no seeded product pairs migration
 * options with a cancellation.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceStatus,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { boundRefId, rowBinding, stringsIn } from "./support/page-config";
import { assign, filter, find, map, some } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockDataset,
  MockMigrationOption,
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
import { useMockContractProduct } from "~/portal/mock/facades";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  productManageActions,
  productMigrationItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

/** The two standings legacy let a client change a product from. */
const CHANGEABLE_STATUS = [
  ContractStatusCodes.ACTIVE,
  ContractStatusCodes.SUSPENDED
];

const REFUSAL_INTENTS = [MOCK_TOAST_INTENT.WARNING, MOCK_TOAST_INTENT.ERROR];

const PRO_RATA_LINE = /pro-rata adjustment/i;

/**
 * What each seeded change option is quoted at on this brand, which asks for a
 * MONTHLY figure (`PRICE_DISPLAY_TYPE`). The monthly terms cost what the seed
 * prices them at; the annual £120.00 over its twelve months reads £10.00 and
 * the annual £48.00 reads £4.00. Written out, so the row is graded against a
 * figure a client would read rather than against the quoter's own answer.
 */
const MONTHLY_QUOTE: Readonly<Record<string, string>> = {
  "cat-analytics-lite": "£6.00 / month",
  "cat-analytics-annual": "£10.00 / month",
  "cat-analytics-pro": "£29.00 / month",
  "cat-analytics-team": "£4.00 / month",
  "cat-mailbox-lite": "£3.00 / month",
  "cat-mailbox-pro": "£14.00 / month"
};

/** The analytics options as the brand QUOTES them — cheapest per month first. */
const QUOTED_ORDER = [
  "cat-analytics-team",
  "cat-analytics-lite",
  "cat-analytics-annual",
  "cat-analytics-pro"
];

/** The same four as the SEED lists them, which is what a per-cycle brand keeps. */
const SEED_ORDER = [
  "cat-analytics-lite",
  "cat-analytics-annual",
  "cat-analytics-pro",
  "cat-analytics-team"
];

const PER_CYCLE_QUOTES = [
  "£6.00 · Monthly",
  "£120.00 · Annually",
  "£29.00 · Monthly",
  "£48.00 · Annually"
];

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

function migratable(data: MockDataset): MockProduct {
  return seeded(
    data,
    "product the brand offers a change on",
    product =>
      product.canModify &&
      product.migrationOptions.length > 0 &&
      product.cancellationRequest === undefined &&
      product.autoExpireAt === undefined &&
      !product.pendingProRata &&
      CHANGEABLE_STATUS.includes(product.status)
  );
}

/** A seed clone with one fact about the migratable product changed. */
function variantOf(mutate: (product: MockProduct) => void): {
  data: MockDataset;
  product: MockProduct;
} {
  const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  const product = migratable(data);
  mutate(product);
  return { data, product };
}

function migrateAction(data: MockDataset, product: MockProduct) {
  return find(productManageActions(data, contextFor(product)), {
    value: mockActionValue(MOCK_ACTION.MIGRATE_PRODUCT, product.id)
  });
}

function targetValue(
  product: MockProduct,
  target: MockMigrationOption
): string {
  return mockActionValue(
    MOCK_ACTION.MIGRATE_PRODUCT,
    `${product.id}:${target.id}`
  );
}

function unpaidFor(data: MockDataset, productId: string) {
  return filter(
    data.invoices,
    invoice =>
      invoice.productId === productId &&
      InvoiceStatusGroups.UNPAID.includes(invoice.status)
  );
}

function migrationRow(pages: ReturnType<typeof productPages>) {
  const page = pages["product-area/billing"];
  const row = rowBinding(page, DATA_REF_ID.PRODUCT_MIGRATION_ITEMS);
  if (row === undefined) throw new Error("no row binds the migration picker");
  return row;
}

describe("the manage band offers a change only where every precondition holds", () => {
  it("offers it on a product the brand lets the client move", () => {
    const { data, product } = variantOf(() => {});

    expect(migrateAction(data, product)?.label).toBeTruthy();
    expect(migrateAction(data, product)?.disabledReason).toBeUndefined();
  });

  it("drops it when the brand does not allow the product to be modified", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, { canModify: false })
    );

    expect(migrateAction(data, product)).toBeUndefined();
  });

  it("drops it when the brand offers nothing to move onto", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, { migrationOptions: [] })
    );

    expect(migrateAction(data, product)).toBeUndefined();
  });

  it("drops it while a cancellation is lodged", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, {
        cancellationRequest: {
          status:
            CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION,
          requestedAt: "2026-08-01",
          reason: "Moving elsewhere"
        }
      })
    );

    expect(migrateAction(data, product)).toBeUndefined();
  });

  it("drops it on a product already set to expire", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, { autoExpireAt: "2026-12-01" })
    );

    expect(migrateAction(data, product)).toBeUndefined();
  });

  it("offers it but disables it while a pro-rata adjustment is still landing", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, { pendingProRata: true })
    );

    expect(migrateAction(data, product)?.disabledReason).toBeTruthy();
  });

  it("offers it but disables it from a standing that is neither active nor suspended", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, { status: ContractStatusCodes.PENDING })
    );

    expect(migrateAction(data, product)?.disabledReason).toBeTruthy();
  });

  it("leaves it usable from suspended, which legacy allowed", () => {
    const { data, product } = variantOf(subject =>
      assign(subject, { status: ContractStatusCodes.SUSPENDED })
    );

    expect(migrateAction(data, product)?.disabledReason).toBeUndefined();
  });
});

describe("the picker is the brand's own list of what this product may become", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("carries one row per option, in the order the brand quotes them, each naming its target", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = migratable(data);
    const rows = productMigrationItems(data, contextFor(product));

    // A brand quoting monthly leads with the cheapest per month, which the
    // seed's own order does not: the £4.00 annual plan is listed last.
    expect(map(product.migrationOptions, "id")).toEqual(SEED_ORDER);
    expect(map(rows, "id")).toEqual(QUOTED_ORDER);
    for (const option of product.migrationOptions) {
      const row = find(rows, { id: option.id });
      const quote = MONTHLY_QUOTE[option.id];
      expect(quote).toBeDefined();
      expect(row?.title).toBe(option.name);
      expect(stringsIn(row)).toContain(targetValue(product, option));
      expect(stringsIn(row).join(" ")).toContain(quote);
    }
  });

  it("keeps the seed's own order for a brand that quotes each term at what it costs", () => {
    const bare = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    const product = migratable(bare);
    const rows = productMigrationItems(bare, contextFor(product));

    expect(map(rows, "id")).toEqual(SEED_ORDER);
    expect(map(rows, "trailingText")).toEqual(PER_CYCLE_QUOTES);
  });

  it("is gated on the product having options at all, and hides where it has none", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const bare = seeded(
      data,
      "product with no migration options",
      product => product.migrationOptions.length === 0
    );
    const row = migrationRow(productPages());
    const visible = row.visible;

    expect(boundRefId(row, "visible")).toBe(
      DATA_REF_ID.PRODUCT_HAS_MIGRATION_OPTIONS
    );
    expect(resolveDataRef(visible, data, contextFor(bare))).toBe(false);
    expect(resolveDataRef(visible, data, contextFor(migratable(data)))).toBe(
      true
    );
    expect(productMigrationItems(data, contextFor(bare))).toEqual([]);
  });
});

describe("choosing a target — the swap, the pro-rata invoice, and the second attempt", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks first, naming the product it would become and what it would cost", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = migratable(data);
    const target = product.migrationOptions[0];
    if (target === undefined) throw new Error("no migration option to choose");
    const nameWas = product.name;

    const asked = dispatchMockAction(
      data,
      contextFor(product),
      targetValue(product, target)
    );
    const copy = `${asked?.confirm?.title ?? ""} ${asked?.confirm?.description ?? ""}`;

    expect(copy).toContain(target.name);
    expect(copy).toContain(target.price.formatted);
    expect(product.name).toBe(nameWas);
  });

  it("the accepted half moves the product onto the target and raises the adjustment", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = migratable(data);
    const target = product.migrationOptions[0];
    if (target === undefined) throw new Error("no migration option to choose");
    const owedBefore = unpaidFor(data, product.id).length;
    const asked = dispatchMockAction(
      data,
      contextFor(product),
      targetValue(product, target)
    );

    const accepted = dispatchMockAction(
      data,
      contextFor(product),
      asked?.confirm?.then ?? ""
    );
    const raised = data.invoices[0];

    expect(product.name).toBe(target.name);
    expect(product.category).toBe(target.category);
    expect(product.price?.formatted).toBe(target.price.formatted);
    expect(product.billingTerm).toBe(target.billingTerm);
    expect(product.pendingProRata).toBe(true);
    expect(raised?.productId).toBe(product.id);
    expect(raised?.status).toBe(InvoiceStatus.UNPAID);
    expect(some(stringsIn(raised), line => PRO_RATA_LINE.test(line))).toBe(
      true
    );
    expect(unpaidFor(data, product.id)).toHaveLength(owedBefore + 1);
    expect(accepted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("refuses a second change while the first adjustment is still landing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = migratable(data);
    const [first, second] = product.migrationOptions;
    if (first === undefined || second === undefined) {
      throw new Error("seed carries fewer than two migration options");
    }
    const firstAsk = dispatchMockAction(
      data,
      contextFor(product),
      targetValue(product, first)
    );
    dispatchMockAction(
      data,
      contextFor(product),
      firstAsk?.confirm?.then ?? ""
    );
    const settledName = product.name;
    const countAfterFirst = data.invoices.length;

    const asked = dispatchMockAction(
      data,
      contextFor(product),
      targetValue(product, second)
    );
    const accepted = dispatchMockAction(
      data,
      contextFor(product),
      asked?.confirm?.then ?? ""
    );
    const intents = [asked?.toast?.intent, accepted?.toast?.intent];

    expect(product.name).toBe(settledName);
    expect(data.invoices).toHaveLength(countAfterFirst);
    expect(some(intents, intent => REFUSAL_INTENTS.includes(intent))).toBe(
      true
    );
    expect(some(intents, intent => intent === MOCK_TOAST_INTENT.SUCCESS)).toBe(
      false
    );
  });

  it("refuses a target the brand never offered, through the facade, and moves nothing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = migratable(data);
    const nameWas = product.name;
    const priceWas = product.price?.formatted;
    const countBefore = data.invoices.length;

    const receipt = useMockContractProduct(data, product.id)
      .useActions()
      .migrate("cat-not-on-offer");

    expect(receipt?.ok ?? false).toBe(false);
    expect(product.name).toBe(nameWas);
    expect(product.price?.formatted).toBe(priceWas);
    expect(product.pendingProRata).toBe(false);
    expect(data.invoices).toHaveLength(countBefore);
  });
});
