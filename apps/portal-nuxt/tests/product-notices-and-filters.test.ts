// -----------------------------------------------------------------------------
/**
 * @module tests/product-notices-and-filters
 * @description Plan F5 O9–O15 and the one deletion. Legacy's `cProdMessages`
 * stacked a message per condition a product was in — moved on, provisioning
 * held, requests left unresolved, a price change coming — each speaking about
 * THAT product, and plan F15 read all four as ADMIN-only and removed them from
 * the client view while keeping the seed facts; `account/menu.ts` gated the
 * affiliate area on two keys, not one; `data/filters/invoice.ts` filtered on
 * the subtotal and the discount as well as the total;
 * `clientContractCancellationModal` warned, by name, that an immediate
 * cancellation cannot be undone.
 *
 * The filter expectations are counted off the seed with lodash against the
 * band vocabulary the control itself publishes, so the collection and this
 * file have to agree; and both are walked page by page, since a filter that
 * narrows only the showing page passes every single-page assertion.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import {
  assign,
  compact,
  filter,
  find,
  flatMap,
  get,
  intersection,
  map,
  size,
  some,
  sortBy
} from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockBrandFeatures,
  MockDataset,
  MockInvoice,
  MockProduct
} from "~/portal/mock/types";
import { PRODUCT_HIERARCHY_AREA_OVERRIDE } from "~/portal/config/areas/product-hierarchy";
import {
  MOCK_ACTION,
  mockActionValue,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import { AMOUNT_BAND_OPTIONS } from "~/portal/mock/collection-filters";
import { CANCEL_OPTION } from "~/portal/mock/contracts/client-contract-product";
import { useCancellationUischema } from "~/portal/mock/contracts/client-contract-product.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { cancellationFormContext } from "~/portal/mock/forms/product-contexts";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { isAffiliateEnabled } from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));

const CONFIG_DIR = join(TESTS_DIR, "..", "app", "portal", "config");

const RETIRED_TABS = "PRODUCT_FILTER_TABS";

const BAND_KEYS = ["netAmount", "discountAmount"];

type Band = {
  readonly value: string;
  readonly min: number;
  readonly max: number;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function carrying(
  data: MockDataset,
  trait: string,
  matches: (product: MockProduct) => boolean
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error(`the seed carries no ${trait}`);
  return product;
}

/**
 * Everything a product's page and its row SAY about its standing — the four
 * surfaces a condition notice would land on. Not the whole page: a provider
 * panel naming its own field is not a notice about it.
 */
function saidAbout(data: MockDataset, product: MockProduct): string {
  const context = contextFor(product);
  const row = find(
    ref<{ id: string }[]>(data, DATA_REF_ID.GROUP_PRODUCT_ITEMS, {
      groupSlug: product.groupSlug
    }),
    { id: product.id }
  );
  return compact([
    ref<string>(data, DATA_REF_ID.PRODUCT_CONDITION_TITLE, context),
    ref<string>(data, DATA_REF_ID.PRODUCT_CONDITION_MESSAGE, context),
    JSON.stringify(
      ref<unknown>(data, DATA_REF_ID.PRODUCT_CONDITION_ACTION, context) ?? ""
    ),
    JSON.stringify(row ?? ""),
    JSON.stringify(
      ref<unknown>(data, DATA_REF_ID.PRODUCT_BILLBOARD_ITEMS, context) ?? ""
    )
  ]).join(" | ");
}

/** The condition a product's page renders, as the four refs hand it over. */
function conditionOf(data: MockDataset, product: MockProduct) {
  const context = contextFor(product);
  return {
    has: ref<boolean>(data, DATA_REF_ID.PRODUCT_HAS_CONDITION, context),
    title: ref<string>(data, DATA_REF_ID.PRODUCT_CONDITION_TITLE, context),
    message: ref<string>(data, DATA_REF_ID.PRODUCT_CONDITION_MESSAGE, context),
    action: ref<unknown>(data, DATA_REF_ID.PRODUCT_CONDITION_ACTION, context)
  };
}

function withFeatures(overrides: Partial<MockBrandFeatures>): MockDataset {
  const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(data, {
    features: assign({}, data.features, overrides)
  });
}

/** The band edges the control's own vocabulary publishes (`under-25`, `25-100`, `500-plus`). */
function bands(): Band[] {
  return map(AMOUNT_BAND_OPTIONS, option => {
    const value = String(option.value);
    const under = /^under-(\d+)$/.exec(value);
    const over = /^(\d+)-plus$/.exec(value);
    const between = /^(\d+)-(\d+)$/.exec(value);
    if (under) return { value, min: -Infinity, max: Number(under[1]) };
    if (over) return { value, min: Number(over[1]), max: Infinity };
    if (between) {
      return { value, min: Number(between[1]), max: Number(between[2]) };
    }
    throw new Error(`the amount band "${value}" reads as no range at all`);
  });
}

function within(amount: number, band: Band): boolean {
  return amount >= band.min && amount < band.max;
}

function invoiceHandle(data: MockDataset) {
  return pagedCollectionHandle(PAGED_COLLECTION_ID.INVOICES, data, {});
}

/** Every row the collection holds, page by page — a filter that narrows one page fails here. */
function everyInvoice(data: MockDataset): MockInvoice[] {
  const handle = invoiceHandle(data);
  const { data: rows, pagination } = handle.useContext();
  const actions = handle.useActions();

  while (pagination.value.page > 1) actions.prevPage();
  const all: MockInvoice[] = [];
  for (let page = 1; page <= pagination.value.pages; page += 1) {
    all.push(...rows.value);
    actions.nextPage();
  }
  return all;
}

function narrowTo(
  data: MockDataset,
  key: string,
  value: string
): MockInvoice[] {
  dispatchMockAction(
    data,
    {},
    `${mockActionValue(MOCK_ACTION.COLLECTION_FILTER, PAGED_COLLECTION_ID.INVOICES)}:${key}:${value}`
  );
  return everyInvoice(data);
}

function listConfigFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listConfigFiles(full) : [full];
  });
}

/**
 * F15 removed the four admin-only notices from the client view under the
 * oracle rule that closed every other over-build; the SEED facts stay, for a
 * staff view that does not exist yet. Each of these grades both halves: the
 * fact is still in the dataset, and no client surface says a word about it.
 */
describe("what a product's own condition no longer says about it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("holds provisioning where the seed says it is held, and renders no notice about it", () => {
    const data = hostgrid();
    const held = carrying(
      data,
      "product with provisioning held",
      product => product.provisioning.paused === true
    );

    expect(held.provisioning.paused).toBe(true);
    expect(held.status).toBe(ContractStatusCodes.AWAITING_ACTIVATION);
    // Its page speaks about the setup it awaits, and never about the hold.
    expect(saidAbout(data, held)).not.toMatch(/paused|on hold|held/i);
  });

  it("counts the requests still unresolved in the seed, and announces none of them", () => {
    const data = hostgrid();
    const stuck = carrying(
      data,
      "product with unresolved provision requests",
      product => (product.provisioning.unresolvedRequests ?? 0) > 0
    );
    const said = saidAbout(data, stuck);

    expect(stuck.provisioning.unresolvedRequests).toBeGreaterThan(0);
    expect(said).not.toMatch(/unresolved|outstanding request/i);
    expect(said).not.toContain(
      `${stuck.provisioning.unresolvedRequests} request`
    );
  });

  it("carries a scheduled price change in the seed, and announces it nowhere", () => {
    const data = hostgrid();
    const repricing = carrying(
      data,
      "product with a scheduled price change",
      product => product.scheduledPriceChange !== undefined
    );
    const change = repricing.scheduledPriceChange;
    const said = saidAbout(data, repricing);

    expect(change?.price.formatted).toBeTruthy();
    expect(change?.effectiveAt).toBeTruthy();
    expect(change?.price.formatted).not.toBe(repricing.price?.formatted);
    // The NEW price is the notice's own fact — the current one stays on the
    // page. Its start day is not asserted: this product's cancellation falls
    // on the same date, so an absence there would prove nothing.
    expect(said).not.toContain(change?.price.formatted ?? "no-price");
    expect(said).not.toMatch(/price (change|rise|increase)|new price/i);
  });

  it("carries a closed and replaced contract in the seed, and points at nothing", () => {
    const data = hostgrid();
    const moved = carrying(
      data,
      "product closed and replaced (`movedTo`)",
      product => product.movedTo !== undefined
    );
    const said = saidAbout(data, moved);

    expect(moved.movedTo?.productId).toBeTruthy();
    expect(said).not.toContain(moved.movedTo?.name ?? "no-name");
    expect(said).not.toContain(
      mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/${moved.groupSlug}/${moved.movedTo?.productId}`
      )
    );
  });

  it("says nothing at all about a product in any of those four conditions", () => {
    const data = hostgrid();
    const carriers = filter(
      data.products,
      product =>
        product.provisioning.paused === true ||
        (product.provisioning.unresolvedRequests ?? 0) > 0 ||
        product.scheduledPriceChange !== undefined ||
        product.movedTo !== undefined
    );
    const stripped: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
    stripped.products = map(stripped.products, product =>
      assign({}, product, {
        provisioning: assign({}, product.provisioning, {
          paused: false,
          unresolvedRequests: 0
        }),
        scheduledPriceChange: undefined,
        movedTo: undefined
      })
    );

    expect(size(carriers)).toBeGreaterThan(1);
    expect(size(data.products)).toBeGreaterThan(size(carriers));

    // Taking all four facts away changes NOTHING a client is shown — which
    // is what "no notice renders" means, said so it can go red.
    for (const product of carriers) {
      const before = conditionOf(data, product);
      const after = conditionOf(
        stripped,
        find(stripped.products, { id: product.id }) ?? product
      );
      expect({ id: product.id, ...after }).toEqual({
        id: product.id,
        ...before
      });
    }
  });
});

describe("the affiliate area needs both of the brand's keys", () => {
  it("opens only where the programme runs AND the client works it themselves", () => {
    const matrix = map(
      [
        [true, true],
        [true, false],
        [false, true],
        [false, false]
      ],
      ([programme, controls]) =>
        isAffiliateEnabled(
          withFeatures({
            UPMIND_AFFILIATES_ENABLED: programme,
            UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED: controls
          })
        )
    );

    expect(matrix).toEqual([true, false, false, false]);
  });
});

describe("the invoice ledger filters on the figures legacy filtered on", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("offers a subtotal band and a discount band beside the total's", () => {
    const controls = invoiceHandle(hostgrid()).useContext().filterControls;

    expect(intersection(map(controls, "key"), BAND_KEYS)).toEqual(BAND_KEYS);
    for (const key of BAND_KEYS) {
      const control = find(controls, { key });
      expect(map(control?.options, "value"), key).toEqual([
        "any",
        ...map(AMOUNT_BAND_OPTIONS, "value")
      ]);
    }
  });

  it("narrows the whole ledger to the subtotals in the chosen band", () => {
    const source = hostgrid().invoices;

    for (const band of bands()) {
      const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
      const expected = filter(source, invoice =>
        within(invoice.subtotal.amount, band)
      );

      const rows = narrowTo(data, "netAmount", band.value);

      expect(sortBy(map(rows, "id")), band.value).toEqual(
        sortBy(map(expected, "id"))
      );
    }
  });

  it("narrows it to the discounts in the chosen band, which is a different figure", () => {
    const source = hostgrid().invoices;
    const discounted = map(bands(), band =>
      filter(source, invoice => within(invoice.discount?.amount ?? 0, band))
    );

    for (const [index, band] of bands().entries()) {
      const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);

      const rows = narrowTo(data, "discountAmount", band.value);

      expect(sortBy(map(rows, "id")), band.value).toEqual(
        sortBy(map(discounted[index], "id"))
      );
    }
    expect(
      some(
        bands(),
        (band, index) =>
          size(discounted[index]) !==
          size(filter(source, invoice => within(invoice.subtotal.amount, band)))
      )
    ).toBe(true);
  });

  it("every band together is the ledger, and no invoice lands in two of them", () => {
    const source = hostgrid().invoices;
    const perBand = map(bands(), band => {
      const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
      return map(narrowTo(data, "netAmount", band.value), "id");
    });
    const all = flatMap(perBand, ids => ids);

    expect(sortBy(all)).toEqual(sortBy(map(source, "id")));
    expect(new Set(all).size).toBe(all.length);
  });

  it("clearing the band puts the whole ledger back", () => {
    const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
    const [firstBand] = bands();

    narrowTo(data, "netAmount", firstBand?.value ?? "");
    const restored = narrowTo(data, "netAmount", "");

    expect(size(restored)).toBe(size(data.invoices));
  });
});

describe("the warning on the way out names what stops", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  function labels(product: MockProduct) {
    const data = hostgrid();
    return filter(
      useCancellationUischema(cancellationFormContext(data, product)).elements,
      element => get(element, "type") === "Label"
    );
  }

  it("warns, by name, that stopping it now cannot be undone", () => {
    const data = hostgrid();
    const running = carrying(
      data,
      "running product",
      product => product.status === ContractStatusCodes.ACTIVE
    );

    const [warning] = labels(running);

    expect(labels(running)).toHaveLength(1);
    expect(get(warning, "text")).toContain(running.name);
    expect(get(warning, "rule.effect")).toBe("SHOW");
    expect(get(warning, "rule.condition.scope")).toBe("#/properties/option");
    expect(get(warning, "rule.condition.schema.enum")).toEqual([
      CANCEL_OPTION.IMMEDIATELY
    ]);
  });

  it("says nothing to a contract that has not started, since nothing is taken away", () => {
    const data = hostgrid();
    const notStarted = carrying(
      data,
      "product not yet started",
      product => product.status === ContractStatusCodes.PENDING
    );

    expect(labels(notStarted)).toEqual([]);
  });
});

describe("what the closure took away", () => {
  it("carries no product status tabs anywhere in the page configuration", () => {
    const offenders = compact(
      map(listConfigFiles(CONFIG_DIR), file =>
        readFileSync(file, "utf8").includes(RETIRED_TABS)
          ? file.replace(CONFIG_DIR, "app/portal/config")
          : undefined
      )
    );

    expect(offenders).toEqual([]);
  });

  it("leaves the product hierarchy area with no second bar to fill", () => {
    const primitives = map(
      Object.values(PRODUCT_HIERARCHY_AREA_OVERRIDE),
      region => get(region, "primitive")
    );

    expect(get(PRODUCT_HIERARCHY_AREA_OVERRIDE, "secondary")).toBeUndefined();
    expect(primitives).not.toContain("secondary");
  });
});
