// -----------------------------------------------------------------------------
/**
 * @module tests/ninth-closure
 * @description Phase F13: the ten client capabilities the ninth audit read as
 * open, and the one staff panel it read as over-built. The relations listing
 * asks legacy's own two switches and orders three ways; the product's Tickets
 * tab mounts the toolbar legacy mounted with the listing; a delegate's grant
 * pickers page and search rather than laying the whole shelf out; the email log
 * asks which days a message went out on; the referral links band by how well
 * each has done; a stored card carries the settlement answer the client gave,
 * where the brand leaves the question open at all; the consolidation form names
 * the schedule a client agrees to follow; the account card's username opens the
 * page that changes it; a renewal invoice that is LATE is named apart from the
 * next one; and the change picker quotes each term the way the brand asks for.
 *
 * Every figure is the seed's own or a facade's own — money is compared against
 * the amounts the seed states, gates are graded on both brands where a seed
 * carries both branches, and a control is graded by the ROWS it returns rather
 * than by the label it wears.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  BrandConfigKeys,
  InvoiceConsolidationRuleTypes,
  PriceDisplayTypes
} from "@upmind-automation/types";
import { propsBinding } from "./support/page-config";
import {
  assign,
  filter,
  find,
  get,
  includes,
  intersection,
  map,
  reject,
  size,
  some,
  sortBy,
  toLower,
  uniq,
  values
} from "lodash-es";
import type { MockCollectionContext } from "~/portal/mock/collections";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockBrandFeatures,
  MockChildAccount,
  MockDataset,
  MockProduct
} from "~/portal/mock/types";
import type { ListControlsState } from "~/portal/modules/list-controls/types";
import { accountPages } from "~/portal/config/account-pages";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  affiliateLinksCollection,
  childAccountsCollection,
  delegateProductsCollection,
  delegateTicketsCollection,
  productTicketsCollection,
  ticketsCollection
} from "~/portal/mock/collection-defs";
import { MOCK_FILTER_FLAG } from "~/portal/mock/collection-filters";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import * as billingSchemas from "~/portal/mock/contracts/client-billing-settings.schemas";
import {
  CONSOLIDATION_WEEKDAY,
  brandConsolidationSchedule
} from "~/portal/mock/contracts/client-billing-settings.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  migrationPriceLabel,
  orderedMigrationOptions
} from "~/portal/mock/facades";
import { billingSettingsFormContext } from "~/portal/mock/forms/billing-contexts";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  accountCardSpecItems,
  delegateProductItems,
  delegateTicketItems,
  productAutoRenewItems,
  productMigrationItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { BRAND_GATE_CONFIG_KEY } from "~/portal/mock/types";
import {
  LIST_CONTROLS_FILTER_KIND,
  LIST_CONTROLS_RANGE_SEPARATOR
} from "~/portal/modules/list-controls/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const CLEARED = "";

/** The delegate the seed gives NAMED access, so the grant pickers render at all. */
const SPECIFIC_DELEGATE: DataRouteContext = { entityId: "dlg-1" };

const ANALYTICS: DataRouteContext = {
  groupSlug: "products",
  productId: "prod-analytics"
};

/** The half-year the seeds' generated tails run through. */
const FIRST_HALF_FROM = "2026-01-01";
const FIRST_HALF_TO = "2026-06-30";

/** The two count bands the links seed actually falls into. */
const BAND_1_TO_10 = "1-10";
const BAND_11_TO_50 = "11-50";

type Seam<TRow, TFilters> = {
  useActions: () => {
    filters: TFilters;
    applyNamedFilter: (key: string, value: string) => void;
    applySort: (value?: string) => void;
    search: (text: string) => void;
    setLimit: (value: number) => void;
  };
  useContext: () => MockCollectionContext<TRow>;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function bothSeeds(): void {
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

/** A fresh clone with some gates flipped — the seed is deep-frozen, and `features` is readonly. */
function withFeatures(overrides: Partial<MockBrandFeatures>): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: assign({}, dataset.features, overrides)
  });
}

function wholeOf<TRow, TFilters>(seam: Seam<TRow, TFilters>): TRow[] {
  const view = seam.useContext();
  seam.useActions().setLimit(Math.max(view.pagination.value.total, 1));
  return view.data.value;
}

function idsOf<TRow extends { id: string }>(rows: readonly TRow[]): string[] {
  return sortBy(map(rows, "id"));
}

function controlKeys<TRow, TFilters>(seam: Seam<TRow, TFilters>): string[] {
  return map(seam.useContext().filterControls, "key");
}

function range(from: string, to: string): string {
  return `${from}${LIST_CONTROLS_RANGE_SEPARATOR}${to}`;
}

function day(stamp: string | undefined): string {
  return (stamp ?? "").slice(0, 10);
}

function inWindow(
  stamp: string | undefined,
  from: string,
  to: string
): boolean {
  return day(stamp) >= from && day(stamp) <= to;
}

function has(value: string | undefined, fragment: string): boolean {
  return includes(toLower(value ?? ""), toLower(fragment));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function controlsState(
  data: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: DataRouteContext
): ListControlsState {
  const state = resolveDataRefProps(
    { value: dataRef(id) },
    data,
    context
  )?.value;
  if (state === undefined) throw new Error(`${id} resolves no control state`);
  return state as ListControlsState;
}

function seededProduct(data: MockDataset, id: string): MockProduct {
  const product = find(data.products, { id });
  if (product === undefined) throw new Error(`seed carries no ${id}`);
  return product;
}

// -----------------------------------------------------------------------------
// F13.1 / F13.2 — the relations listing's own band
// -----------------------------------------------------------------------------

function childPanel(data: MockDataset): Seam<
  MockChildAccount,
  {
    allowImpersonation: (value?: boolean) => void;
    inheritPaymentDetails: (value?: boolean) => void;
    dateCreated: (value?: string) => void;
  }
> {
  return childAccountsCollection.resolve(data, NO_CONTEXT);
}

describe("F13.1 — the relations listing asks legacy's own three questions", () => {
  beforeEach(bothSeeds);

  it("narrows the child accounts to the ones inheriting payment details, and to the ones with their own", () => {
    const seam = childPanel(hostgrid());
    const everyChild = [...wholeOf(seam)];
    const inheriting = filter(everyChild, { inherit_payment_details: true });
    const ownCards = reject(everyChild, { inherit_payment_details: true });

    expect(size(everyChild)).toBe(3);
    expect(size(inheriting)).toBe(1);
    expect(size(ownCards)).toBe(2);

    // The new switch stands BESIDE the one legacy already had, not over it.
    expect(controlKeys(seam)).toEqual([
      "allowImpersonation",
      "inheritPaymentDetails",
      "dateCreated"
    ]);
    expect(
      find(seam.useContext().filterControls, { key: "dateCreated" })?.kind
    ).toBe(LIST_CONTROLS_FILTER_KIND.DATE_RANGE);

    seam.useActions().filters.inheritPaymentDetails(true);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(inheriting));
    seam.useActions().filters.inheritPaymentDetails(false);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(ownCards));
    seam.useActions().filters.inheritPaymentDetails(undefined);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(everyChild));

    // The band writes its own option values; the contract's setter writes a
    // boolean. Both doors reach the same rows.
    seam
      .useActions()
      .applyNamedFilter("inheritPaymentDetails", MOCK_FILTER_FLAG.YES);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(inheriting));
    seam.useActions().applyNamedFilter("inheritPaymentDetails", CLEARED);

    // The switch legacy already had still answers, and so does the window.
    seam.useActions().filters.allowImpersonation(true);
    expect(idsOf(wholeOf(seam))).toEqual(
      idsOf(filter(everyChild, { allow_impersonation: true }))
    );
    seam.useActions().filters.allowImpersonation(undefined);

    seam
      .useActions()
      .filters.dateCreated(range(FIRST_HALF_FROM, FIRST_HALF_TO));
    expect(idsOf(wholeOf(seam))).toEqual(
      idsOf(
        filter(everyChild, child =>
          inWindow(child.created_at, FIRST_HALF_FROM, FIRST_HALF_TO)
        )
      )
    );
    expect(size(wholeOf(seam))).toBe(2);
    seam.useActions().filters.dateCreated(undefined);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(everyChild));

    // The brand managing nobody offers the same band over an empty panel.
    expect(wholeOf(childPanel(minimal()))).toEqual([]);
  });

  it("orders the child accounts by name and by the day they were added", () => {
    const seam = childPanel(hostgrid());
    const everyChild = [...wholeOf(seam)];
    const options = map(seam.useContext().sortOptions, "value");
    expect(size(options)).toBe(2);

    // The order the rows are WRITTEN in, which neither option answers with —
    // a produced order matching it would be the sort doing nothing.
    const seedOrder = map(hostgrid().childAccounts, "id");
    expect(seedOrder).toEqual(["rel-1", "rel-2", "rel-3"]);
    expect(size(everyChild)).toBe(3);

    const ordersProduced = map(options, option => {
      seam.useActions().applySort(option);
      return map(wholeOf(seam), "id");
    });
    seam.useActions().applySort(CLEARED);

    // Atlas / Harbor / Studio by name; newest relation first by the day it
    // was made — legacy's own two, which name and date are.
    expect(ordersProduced).toEqual([
      ["rel-2", "rel-3", "rel-1"],
      ["rel-3", "rel-2", "rel-1"]
    ]);
    expect(size(uniq(map(ordersProduced, ids => ids.join(","))))).toBe(2);
    expect(ordersProduced).not.toContainEqual(seedOrder);
  });
});

// -----------------------------------------------------------------------------
// F13.3 — the product's own Tickets tab
// -----------------------------------------------------------------------------

describe("F13.2 — the product's Tickets tab carries the listing's toolbar", () => {
  beforeEach(bothSeeds);

  it("the product Tickets tab mounts the tickets toolbar", () => {
    const data = hostgrid();
    const page = productPages()["product-area/tickets"];
    const tab: Seam<
      { id: string; department: string; createdAt: string },
      { department: (v?: string) => void }
    > = productTicketsCollection.resolve(data, ANALYTICS);
    const pillar: Seam<
      { id: string; department: string; createdAt: string },
      { department: (v?: string) => void }
    > = ticketsCollection.resolve(data, NO_CONTEXT);

    // The band is MOUNTED, not merely available: the tab's own header binds
    // the panel's control state.
    expect(
      propsBinding(page, DATA_REF_ID.PRODUCT_TICKETS_CONTROLS)
    ).toBeDefined();

    const state = controlsState(
      data,
      DATA_REF_ID.PRODUCT_TICKETS_CONTROLS,
      ANALYTICS
    );
    expect(state.searchAction).toBeTruthy();
    expect(map(state.filters ?? [], "key")).toEqual(["status", "dateCreated"]);
    // The pillar's own toolbar asks the same questions of the same rows.
    expect(intersection(controlKeys(tab), controlKeys(pillar))).toEqual(
      controlKeys(pillar)
    );

    const everyThread = [...wholeOf(tab)];
    expect(size(everyThread)).toBe(14);
    const department = everyThread[0]?.department;
    if (department === undefined) throw new Error("the tab carries no desk");

    tab.useActions().filters.department(department);
    expect(idsOf(wholeOf(tab))).toEqual(
      idsOf(filter(everyThread, thread => thread.department === department))
    );
    expect(size(wholeOf(tab))).toBeLessThan(size(everyThread));
    tab.useActions().filters.department(undefined);
    expect(idsOf(wholeOf(tab))).toEqual(idsOf(everyThread));

    // Every row the tab narrows is one of THIS product's threads.
    expect(
      oneValueAcross(
        everyThread,
        thread => find(data.tickets, { id: thread.id })?.productId
      )
    ).toBe("prod-analytics");
  });
});

/** The one value a mapping yields across every row, or undefined where it differs. */
function oneValueAcross<TRow, TValue>(
  rows: readonly TRow[],
  read: (row: TRow) => TValue
): TValue | undefined {
  const distinct = uniq(map(rows, read));
  if (size(distinct) !== 1) return undefined;
  return distinct[0];
}

// -----------------------------------------------------------------------------
// F13.3 — a delegate's grant pickers
// -----------------------------------------------------------------------------

describe("F13.3 — the grant pickers page and search their shelves", () => {
  beforeEach(bothSeeds);

  it("searches and pages the products a delegate may be granted", () => {
    const data = hostgrid();
    const seam: Seam<{ id: string; name: string }, unknown> =
      delegateProductsCollection.resolve(data, SPECIFIC_DELEGATE);
    const page = accountPages()[PAGE_KEY.ACCOUNT_DELEGATE_DETAIL];

    expect(size(data.products)).toBeGreaterThan(MOCK_PAGE_LIMIT);
    expect(seam.useContext().pagination.value.total).toBe(size(data.products));
    expect(seam.useContext().isSearchable).toBe(true);
    expect(size(seam.useContext().sortOptions)).toBeGreaterThan(1);
    expect(
      propsBinding(page, DATA_REF_ID.DELEGATE_PRODUCTS_CONTROLS)
    ).toBeDefined();

    // The PICKER shows one page, not the whole shelf.
    const first = delegateProductItems(data, SPECIFIC_DELEGATE);
    expect(size(first)).toBe(MOCK_PAGE_LIMIT);

    dispatchMockAction(
      data,
      SPECIFIC_DELEGATE,
      `${MOCK_ACTION.PAGE_NEXT}:${PAGED_COLLECTION_ID.DELEGATE_PRODUCTS}`
    );
    const second = delegateProductItems(data, SPECIFIC_DELEGATE);
    expect(size(second)).toBe(MOCK_PAGE_LIMIT);
    expect(intersection(map(second, "id"), map(first, "id"))).toEqual([]);

    dispatchMockAction(
      data,
      SPECIFIC_DELEGATE,
      `${MOCK_ACTION.PAGE_PREV}:${PAGED_COLLECTION_ID.DELEGATE_PRODUCTS}`
    );
    dispatchMockAction(
      data,
      SPECIFIC_DELEGATE,
      `${mockActionValue(
        MOCK_ACTION.COLLECTION_SEARCH,
        PAGED_COLLECTION_ID.DELEGATE_PRODUCTS
      )}:analytics`
    );
    const found = delegateProductItems(data, SPECIFIC_DELEGATE);
    const matching = filter(data.products, product =>
      has(product.name, "analytics")
    );
    expect(size(found)).toBeGreaterThan(0);
    expect(size(found)).toBeLessThan(size(data.products));
    expect(sortBy(map(found, "id"))).toEqual(idsOf(matching));
    // Every row still carries the grant switch the picker exists for.
    expect(oneValueAcross(found, row => row.toggle !== undefined)).toBe(true);
  });

  it("searches and pages the tickets a delegate may be granted", () => {
    const data = hostgrid();
    const seam: Seam<{ id: string; subject: string }, unknown> =
      delegateTicketsCollection.resolve(data, SPECIFIC_DELEGATE);
    const page = accountPages()[PAGE_KEY.ACCOUNT_DELEGATE_DETAIL];

    expect(size(data.tickets)).toBeGreaterThan(MOCK_PAGE_LIMIT);
    expect(seam.useContext().pagination.value.total).toBe(size(data.tickets));
    expect(seam.useContext().isSearchable).toBe(true);
    expect(size(seam.useContext().sortOptions)).toBeGreaterThan(1);
    expect(
      propsBinding(page, DATA_REF_ID.DELEGATE_TICKETS_CONTROLS)
    ).toBeDefined();

    const first = delegateTicketItems(data, SPECIFIC_DELEGATE);
    expect(size(first)).toBe(MOCK_PAGE_LIMIT);

    dispatchMockAction(
      data,
      SPECIFIC_DELEGATE,
      `${MOCK_ACTION.PAGE_NEXT}:${PAGED_COLLECTION_ID.DELEGATE_TICKETS}`
    );
    const second = delegateTicketItems(data, SPECIFIC_DELEGATE);
    expect(size(second)).toBe(MOCK_PAGE_LIMIT);
    expect(intersection(map(second, "id"), map(first, "id"))).toEqual([]);

    dispatchMockAction(
      data,
      SPECIFIC_DELEGATE,
      `${MOCK_ACTION.PAGE_PREV}:${PAGED_COLLECTION_ID.DELEGATE_TICKETS}`
    );
    dispatchMockAction(
      data,
      SPECIFIC_DELEGATE,
      `${mockActionValue(
        MOCK_ACTION.COLLECTION_SEARCH,
        PAGED_COLLECTION_ID.DELEGATE_TICKETS
      )}:renewal`
    );
    const found = delegateTicketItems(data, SPECIFIC_DELEGATE);
    const matching = filter(
      data.tickets,
      ticket =>
        has(ticket.subject, "renewal") ||
        has(ticket.reference, "renewal") ||
        has(ticket.department, "renewal")
    );
    expect(size(found)).toBeGreaterThan(0);
    expect(size(found)).toBeLessThan(size(data.tickets));
    expect(sortBy(map(found, "id"))).toEqual(idsOf(matching));
    expect(oneValueAcross(found, row => row.toggle !== undefined)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// F13.4 — the email log's window
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// F13.5 — the referral links' own bands
// -----------------------------------------------------------------------------

describe("F13.5 — the links table bands by how well each link has done", () => {
  beforeEach(bothSeeds);

  it("bands the links by how many visits and how many referrals each one brought", () => {
    const seam: Seam<
      { id: string; clicks: number; signups: number; createdAt: string },
      {
        visits: (v?: string) => void;
        referrals: (v?: string) => void;
        dateCreated: (v?: string) => void;
      }
    > = affiliateLinksCollection.resolve(hostgrid(), NO_CONTEXT);

    const everyLink = [...wholeOf(seam)];
    expect(size(everyLink)).toBe(24);
    expect(controlKeys(seam)).toEqual(["visits", "referrals", "dateCreated"]);

    // The two counts are DIFFERENT questions of the same row: the visits band
    // holds one link and the referrals band seven, so a predicate reading the
    // wrong count cannot answer both.
    seam.useActions().filters.visits(BAND_11_TO_50);
    expect(size(wholeOf(seam))).toBe(1);
    expect(idsOf(wholeOf(seam))).toEqual(
      idsOf(filter(everyLink, link => link.clicks >= 11 && link.clicks < 51))
    );
    seam.useActions().filters.visits(undefined);

    seam.useActions().filters.referrals(BAND_1_TO_10);
    expect(size(wholeOf(seam))).toBe(7);
    expect(idsOf(wholeOf(seam))).toEqual(
      idsOf(filter(everyLink, link => link.signups >= 1 && link.signups < 11))
    );
    seam.useActions().filters.referrals(BAND_11_TO_50);
    expect(size(wholeOf(seam))).toBe(17);
    seam.useActions().filters.referrals(undefined);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(everyLink));

    seam.useActions().filters.dateCreated(range("2026-01-01", "2026-12-31"));
    expect(size(wholeOf(seam))).toBe(16);
    seam.useActions().filters.dateCreated(undefined);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(everyLink));

    expect(
      wholeOf(affiliateLinksCollection.resolve(minimal(), NO_CONTEXT))
    ).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// F13.6 — the settlement question on a new card
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// F13.7 — what following the brand's consolidation means
// -----------------------------------------------------------------------------

describe("F13.7 — the inherit choice names the schedule it follows", () => {
  beforeEach(bothSeeds);

  it("names the brand's own consolidation schedule in the inherit choice", () => {
    expect(BRAND_GATE_CONFIG_KEY.INVOICE_CONSOLIDATION_BASE_RULE).toBe(
      BrandConfigKeys.INVOICE_CONSOLIDATION_BASE_RULE
    );
    expect(BRAND_GATE_CONFIG_KEY.INVOICE_CONSOLIDATION_WEEK_DAY).toBe(
      BrandConfigKeys.INVOICE_CONSOLIDATION_WEEK_DAY
    );
    expect(BRAND_GATE_CONFIG_KEY.INVOICE_CONSOLIDATION_DATE).toBe(
      BrandConfigKeys.INVOICE_CONSOLIDATION_DATE
    );

    // The two seeds run opposite rules, so both branches of the wording are
    // graded rather than one.
    expect(hostgrid().features.INVOICE_CONSOLIDATION_BASE_RULE).toBe(
      InvoiceConsolidationRuleTypes.DAY_OF_WEEK
    );
    expect(hostgrid().features.INVOICE_CONSOLIDATION_WEEK_DAY).toBe(
      CONSOLIDATION_WEEKDAY.MONDAY
    );
    expect(minimal().features.INVOICE_CONSOLIDATION_BASE_RULE).toBe(
      InvoiceConsolidationRuleTypes.DAY_OF_MONTH
    );
    expect(minimal().features.INVOICE_CONSOLIDATION_DATE).toBe(15);

    for (const data of [hostgrid(), minimal()]) {
      const schedule = brandConsolidationSchedule(
        data.features.INVOICE_CONSOLIDATION_BASE_RULE,
        data.features.INVOICE_CONSOLIDATION_WEEK_DAY,
        data.features.INVOICE_CONSOLIDATION_DATE
      );
      const context = billingSettingsFormContext(data);
      const choices = get(
        billingSchemas.useSchema(context),
        "properties.consolidation.options"
      );
      const labels = map(choices, "label");
      const naming = filter(labels, label => includes(label, schedule));

      expect(context.brandSchedule).toBe(schedule);
      expect(schedule).toBeTruthy();
      expect(size(labels)).toBe(3);
      // Exactly ONE of the three choices states it — the one that follows it.
      expect(size(naming)).toBe(1);
    }

    // The two brands read differently, so the wording is the brand's own.
    const hostgridLabels = map(
      get(
        billingSchemas.useSchema(billingSettingsFormContext(hostgrid())),
        "properties.consolidation.options"
      ),
      "label"
    );
    const minimalLabels = map(
      get(
        billingSchemas.useSchema(billingSettingsFormContext(minimal())),
        "properties.consolidation.options"
      ),
      "label"
    );
    expect(hostgridLabels).not.toEqual(minimalLabels);
  });
});

// -----------------------------------------------------------------------------
// F13.8 — the username row on the account card
// -----------------------------------------------------------------------------

const SECURITY_PATH = "/account/security";

describe("F13.8 — the username row points at the page that changes it", () => {
  beforeEach(bothSeeds);

  it("the username row links to the security page and offers a copy", () => {
    const data = minimal();
    const row = find(accountCardSpecItems(data), { id: "username" });

    expect(row?.value).toBe(data.persona.username);
    expect(row?.to).toBe(SECURITY_PATH);
    expect(row?.copyable).toBe(true);
    // The row states the name; it carries no form of its own.
    expect(row?.action).toBeUndefined();
  });

  it("withholds the username row where it repeats the default email address", () => {
    const repeated = hostgrid();
    const distinct = minimal();
    const defaultAddress = find(
      repeated.emails,
      entry => entry.meta?.isDefault === true
    )?.email;

    expect(repeated.persona.username).toBe(defaultAddress);
    expect(distinct.persona.username).not.toBe(
      find(distinct.emails, entry => entry.meta?.isDefault === true)?.email
    );

    expect(
      find(accountCardSpecItems(repeated), { id: "username" })
    ).toBeUndefined();
    expect(
      find(accountCardSpecItems(distinct), { id: "username" })
    ).toBeDefined();
    // The rest of the card is untouched either way.
    expect(some(accountCardSpecItems(repeated), { id: "account-type" })).toBe(
      true
    );
  });
});

// -----------------------------------------------------------------------------
// F13.9 — a renewal invoice that is already late
// -----------------------------------------------------------------------------

function renewalLabel(
  data: MockDataset,
  productId: string
): string | undefined {
  return find(
    productAutoRenewItems(data, { groupSlug: "products", productId }),
    { id: "renewal-invoice" }
  )?.action?.label;
}

describe("F13.9 — a late renewal invoice is named apart from the next one", () => {
  beforeEach(bothSeeds);

  it("names the late renewal invoice apart from the next one", () => {
    const data = hostgrid();
    const ahead = seededProduct(data, "prod-vault");
    const passed = seededProduct(data, "prod-mail");

    // The two seeded products sit either side of today, so the pair grades
    // the branch rather than a fixture.
    expect(ahead.nextDueDate).toBe("2027-01-11");
    expect(day(ahead.nextDueDate) > today()).toBe(true);
    expect(day(passed.nextDueDate) < today()).toBe(true);

    expect(renewalLabel(data, "prod-vault")).toBe("Issue next invoice");
    expect(renewalLabel(data, "prod-mail")).toBe("Create late renewal invoice");
    expect(renewalLabel(data, "prod-vault")).not.toBe(
      renewalLabel(data, "prod-mail")
    );

    // Both still raise the same invoice through the same door.
    expect(
      find(
        productAutoRenewItems(data, {
          groupSlug: "products",
          productId: "prod-mail"
        }),
        { id: "renewal-invoice" }
      )?.action?.value
    ).toBe(mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, "prod-mail"));
  });
});

// -----------------------------------------------------------------------------
// F13.10 — how the change picker quotes each term
// -----------------------------------------------------------------------------

/** The seeded change options, as the seed states them, in the seed's order. */
const SEEDED_OPTIONS = [
  { id: "cat-analytics-lite", price: "£6.00", term: "Monthly" },
  { id: "cat-analytics-annual", price: "£120.00", term: "Annually" },
  { id: "cat-analytics-pro", price: "£29.00", term: "Monthly" },
  { id: "cat-analytics-team", price: "£48.00", term: "Annually" }
] as const;

/**
 * What each option comes to per MONTH, in the seed's own order: the monthly
 * terms cost what they cost, the annual £120.00 works out at £10.00 and the
 * annual £48.00 at £4.00. Written out rather than recomputed, so each
 * assertion states the figure a client reads.
 */
const MONTHLY_QUOTES_IN_SEED_ORDER = [
  "£6.00 / month",
  "£10.00 / month",
  "£29.00 / month",
  "£4.00 / month"
];

const PER_CYCLE = [
  "£6.00 · Monthly",
  "£120.00 · Annually",
  "£29.00 · Monthly",
  "£48.00 · Annually"
];

/**
 * Cheapest monthly figure first — legacy ordered the picker by the figure it
 * quotes, which puts the £4.00 annual plan above the £6.00 monthly one it is
 * listed below in the seed.
 */
const BY_MONTHLY_FIGURE = [
  "cat-analytics-team",
  "cat-analytics-lite",
  "cat-analytics-annual",
  "cat-analytics-pro"
];

const MONTHLY_QUOTES_CHEAPEST_FIRST = [
  "£4.00 / month",
  "£6.00 / month",
  "£10.00 / month",
  "£29.00 / month"
];

describe("F13.10 — the change picker quotes each term the way the brand asks", () => {
  beforeEach(bothSeeds);

  it("quotes the change options at their lowest monthly price where the brand asks for it", () => {
    // The shipped brand asks for `abs_min`, so `lowest_monthly_price` is
    // graded on a clone — the setting under test is the one being set.
    const lowest = withFeatures({
      PRICE_DISPLAY_TYPE: PriceDisplayTypes.LOWEST_MONTHLY_PRICE
    });
    const cycle = minimal();
    const product = seededProduct(lowest, "prod-analytics");
    const options = product.migrationOptions;

    expect(BRAND_GATE_CONFIG_KEY.PRICE_DISPLAY_TYPE).toBe(
      BrandConfigKeys.PRICE_DISPLAY_TYPE
    );
    expect(cycle.features.PRICE_DISPLAY_TYPE).toBe(PriceDisplayTypes.CYCLE);

    // The seed states these four prices and terms; the quotes below are what
    // each brand makes of them.
    expect(
      map(options, option => ({
        id: option.id,
        price: option.price.formatted,
        term: option.billingTerm
      }))
    ).toEqual(SEEDED_OPTIONS.map(option => ({ ...option })));

    expect(map(options, option => migrationPriceLabel(lowest, option))).toEqual(
      MONTHLY_QUOTES_IN_SEED_ORDER
    );
    expect(map(options, option => migrationPriceLabel(cycle, option))).toEqual(
      PER_CYCLE
    );

    // The cheapest per MONTH leads, which the seed's own order does not: the
    // £4.00 annual plan is listed last and quoted first.
    expect(map(orderedMigrationOptions(lowest, product), "id")).toEqual(
      BY_MONTHLY_FIGURE
    );
    expect(
      map(
        orderedMigrationOptions(cycle, seededProduct(cycle, "prod-analytics")),
        "id"
      )
    ).toEqual(map(SEEDED_OPTIONS, "id"));

    const rows = productMigrationItems(lowest, ANALYTICS);
    expect(map(rows, "id")).toEqual(BY_MONTHLY_FIGURE);
    expect(map(rows, "trailingText")).toEqual(MONTHLY_QUOTES_CHEAPEST_FIRST);
  });

  it("reads the brand's other monthly setting the same way", () => {
    const monthlyFrom = hostgrid();
    const lowest = withFeatures({
      PRICE_DISPLAY_TYPE: PriceDisplayTypes.LOWEST_MONTHLY_PRICE
    });
    const product = seededProduct(monthlyFrom, "prod-analytics");
    const options = product.migrationOptions;

    // `abs_min` is the platform's other "quote it monthly" setting, and the
    // shipped brand runs on it; legacy took both branches down one path.
    expect(monthlyFrom.features.PRICE_DISPLAY_TYPE).toBe(
      PriceDisplayTypes.MONTHLY_FROM
    );
    expect(
      map(options, option => migrationPriceLabel(monthlyFrom, option))
    ).toEqual(MONTHLY_QUOTES_IN_SEED_ORDER);
    expect(map(orderedMigrationOptions(monthlyFrom, product), "id")).toEqual(
      BY_MONTHLY_FIGURE
    );

    const rows = productMigrationItems(monthlyFrom, ANALYTICS);
    expect(map(rows, "id")).toEqual(BY_MONTHLY_FIGURE);
    expect(map(rows, "trailingText")).toEqual(MONTHLY_QUOTES_CHEAPEST_FIRST);

    // The two settings answer alike, which is the whole of what `abs_min` adds.
    expect(
      map(options, option => migrationPriceLabel(monthlyFrom, option))
    ).toEqual(map(options, option => migrationPriceLabel(lowest, option)));
  });
});

// -----------------------------------------------------------------------------
// F13.11 — the panel the ninth audit read as the desk's
// -----------------------------------------------------------------------------

describe("F13.11 — the client's credit page keeps no movement ledger", () => {
  beforeEach(bothSeeds);

  it("declares no wallet-movement panel, collection, pager or ref", () => {
    expect(
      filter(values(DATA_REF_ID), id => /wallet-transaction/i.test(id))
    ).toEqual([]);
    expect(
      filter(values(PAGED_COLLECTION_ID), id => /wallet/i.test(id))
    ).toEqual([]);
  });
});
