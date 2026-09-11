// -----------------------------------------------------------------------------
/**
 * @module tests/filter-seams
 * @description The filter seam sweep: every collection publishes a map of
 * NAMED setters, and a setter that writes a criteria key nobody reads is a
 * published seam answering no caller. Each panel here is driven through its
 * own contract map — `filters.number(...)`, `filters.contractProductId(...)`,
 * `filters.dateCreated(...)` — and graded on the rows that come back, not on
 * the key that went in.
 *
 * The expectations are counted off the shipped seed rather than authored: the
 * totals and narrowed sizes below were read from the seed the store ships, and
 * every narrowed SET is cross-checked against an independent predicate over
 * the panel's own unnarrowed rows, so a count that happens to match cannot
 * pass a predicate reading the wrong field. Both seeds are graded wherever the
 * seed carries the rows; the minimal brand's empty panels are graded as the
 * other side of the same seam.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  every,
  filter,
  includes,
  keys,
  last,
  map,
  size,
  some,
  sortBy,
  toLower,
  uniq
} from "lodash-es";
import type { MockCollectionContext } from "~/portal/mock/collections";
import type { AffiliateCommissionsFilters } from "~/portal/mock/contracts/client-affiliate";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import {
  affiliateCommissionsCollection,
  affiliateLinksCollection,
  affiliatePayoutsCollection,
  affiliateReferralsCollection,
  childAccountsCollection,
  creditStatementsCollection,
  groupProductsCollection,
  invoicesCollection,
  productInvoicesCollection,
  productTicketsCollection,
  ticketsCollection
} from "~/portal/mock/collection-defs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { LIST_CONTROLS_RANGE_SEPARATOR } from "~/portal/modules/list-controls/types";

const NO_CONTEXT: DataRouteContext = {};

const PRODUCTS_CONTEXT: DataRouteContext = { groupSlug: "products" };

/** The product every listing here scopes to — the one the seed gives its own ledgers. */
const ANALYTICS_CONTEXT: DataRouteContext = { productId: "prod-analytics" };

const CLEARED = "";

/** The half-year the seeds' generated tails run through. */
const FIRST_HALF_FROM = "2026-01-01";
const FIRST_HALF_TO = "2026-06-30";

/**
 * One paged panel, typed off the members this file drives. `filters` carries
 * the definition's own contract map, which is the seam under test.
 */
type Seam<TRow, TFilters> = {
  useActions: () => {
    filters: TFilters;
    applyNamedFilter: (key: string, value: string) => void;
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

/** Every row the panel holds, by widening its page to the whole. */
function wholeOf<TRow, TFilters>(seam: Seam<TRow, TFilters>): TRow[] {
  const view = seam.useContext();
  seam.useActions().setLimit(Math.max(view.pagination.value.total, 1));
  return view.data.value;
}

function idsOf<TRow extends { id: string }>(rows: readonly TRow[]): string[] {
  return sortBy(map(rows, "id"));
}

function range(from: string, to: string): string {
  return `${from}${LIST_CONTROLS_RANGE_SEPARATOR}${to}`;
}

/** The day part of a stamp — the unit a "between these days" window is asked in. */
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

function controlKeys<TRow, TFilters>(seam: Seam<TRow, TFilters>): string[] {
  return map(seam.useContext().filterControls, "key");
}

// -----------------------------------------------------------------------------
// The listings' own named narrowings
// -----------------------------------------------------------------------------

describe("every named filter setter narrows the rows it names", () => {
  beforeEach(bothSeeds);

  it("the products listing's own name setter narrows the rows", () => {
    const rich: Seam<
      { id: string; name: string },
      { name: (v?: string) => void }
    > = groupProductsCollection.resolve(hostgrid(), PRODUCTS_CONTEXT);
    const bare: Seam<
      { id: string; name: string },
      { name: (v?: string) => void }
    > = groupProductsCollection.resolve(minimal(), PRODUCTS_CONTEXT);

    const everyRich = [...wholeOf(rich)];
    const everyBare = [...wholeOf(bare)];
    expect(size(everyRich)).toBe(24);
    expect(size(everyBare)).toBe(1);

    rich.useActions().filters.name("team");
    expect(size(wholeOf(rich))).toBe(3);
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(filter(everyRich, product => has(product.name, "team")))
    );
    rich.useActions().filters.name(undefined);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyRich));

    // The brand carrying ONE product answers the same setter on both sides.
    bare.useActions().filters.name("analytics");
    expect(size(wholeOf(bare))).toBe(1);
    bare.useActions().filters.name("team");
    expect(wholeOf(bare)).toEqual([]);
    bare.useActions().filters.name(undefined);
    expect(idsOf(wholeOf(bare))).toEqual(idsOf(everyBare));
  });

  it("the invoices listing's own number setter narrows the rows", () => {
    const rich: Seam<
      { id: string; number: string },
      { number: (v?: string) => void }
    > = invoicesCollection.resolve(hostgrid(), NO_CONTEXT);
    const bare: Seam<
      { id: string; number: string },
      { number: (v?: string) => void }
    > = invoicesCollection.resolve(minimal(), NO_CONTEXT);
    const tab: Seam<
      { id: string; number: string },
      { number: (v?: string) => void }
    > = productInvoicesCollection.resolve(hostgrid(), ANALYTICS_CONTEXT);

    const everyRich = [...wholeOf(rich)];
    const everyBare = [...wholeOf(bare)];
    const everyTab = [...wholeOf(tab)];
    expect(size(everyRich)).toBe(92);
    expect(size(everyBare)).toBe(2);
    expect(size(everyTab)).toBe(24);

    rich.useActions().filters.number("INV-009");
    expect(size(wholeOf(rich))).toBe(5);
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(filter(everyRich, invoice => has(invoice.number, "INV-009")))
    );
    rich.useActions().filters.number(undefined);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyRich));

    bare.useActions().filters.number("INV-009");
    expect(size(wholeOf(bare))).toBe(2);
    bare.useActions().filters.number(undefined);
    expect(idsOf(wholeOf(bare))).toEqual(idsOf(everyBare));

    // The product's OWN billing tab publishes the same setter over its own set.
    tab.useActions().filters.number("INV-009");
    expect(size(wholeOf(tab))).toBe(1);
    expect(idsOf(wholeOf(tab))).toEqual(
      idsOf(filter(everyTab, invoice => has(invoice.number, "INV-009")))
    );
    tab.useActions().filters.number(undefined);
    expect(idsOf(wholeOf(tab))).toEqual(idsOf(everyTab));
  });

  it("the invoices listing's own contractProductId setter narrows to that product's documents", () => {
    const rich: Seam<
      { id: string; productId?: string },
      { contractProductId: (v?: string) => void }
    > = invoicesCollection.resolve(hostgrid(), NO_CONTEXT);
    const bare: Seam<
      { id: string; productId?: string },
      { contractProductId: (v?: string) => void }
    > = invoicesCollection.resolve(minimal(), NO_CONTEXT);

    const everyRich = [...wholeOf(rich)];
    const everyBare = [...wholeOf(bare)];

    rich.useActions().filters.contractProductId("prod-analytics");
    expect(size(wholeOf(rich))).toBe(24);
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(
        filter(everyRich, invoice => invoice.productId === "prod-analytics")
      )
    );
    rich.useActions().filters.contractProductId("prod-mail");
    expect(size(wholeOf(rich))).toBe(1);
    rich.useActions().filters.contractProductId(undefined);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyRich));

    bare.useActions().filters.contractProductId("prod-analytics");
    expect(size(wholeOf(bare))).toBe(1);
    bare.useActions().filters.contractProductId("prod-mail");
    expect(wholeOf(bare)).toEqual([]);
    bare.useActions().filters.contractProductId(undefined);
    expect(idsOf(wholeOf(bare))).toEqual(idsOf(everyBare));
  });

  it("the referrals panel's own dateCreated setter narrows the rows", () => {
    const rich: Seam<
      { id: string; date: string },
      { dateCreated: (v?: string) => void }
    > = affiliateReferralsCollection.resolve(hostgrid(), NO_CONTEXT);
    const bare: Seam<
      { id: string; date: string },
      { dateCreated: (v?: string) => void }
    > = affiliateReferralsCollection.resolve(minimal(), NO_CONTEXT);

    const everyRich = [...wholeOf(rich)];
    expect(size(everyRich)).toBe(24);

    rich
      .useActions()
      .filters.dateCreated(range(FIRST_HALF_FROM, FIRST_HALF_TO));
    expect(size(wholeOf(rich))).toBe(13);
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(
        filter(everyRich, referral =>
          inWindow(referral.date, FIRST_HALF_FROM, FIRST_HALF_TO)
        )
      )
    );
    rich.useActions().filters.dateCreated(undefined);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyRich));

    // The band's own control writes the SAME key, so both doors agree.
    rich
      .useActions()
      .applyNamedFilter("dateCreated", range(FIRST_HALF_FROM, FIRST_HALF_TO));
    expect(size(wholeOf(rich))).toBe(13);
    rich.useActions().applyNamedFilter("dateCreated", CLEARED);

    // The brand running no programme has no referral to narrow.
    expect(wholeOf(bare)).toEqual([]);
  });

  it("searches the child accounts by name and by email", () => {
    const rich: Seam<{ id: string; name: string; email: string }, unknown> =
      childAccountsCollection.resolve(hostgrid(), NO_CONTEXT);
    const bare: Seam<{ id: string; name: string; email: string }, unknown> =
      childAccountsCollection.resolve(minimal(), NO_CONTEXT);

    const everyChild = [...wholeOf(rich)];
    expect(size(everyChild)).toBe(3);
    expect(rich.useContext().isSearchable).toBe(true);

    // A fragment the NAME carries and no address does, and one the ADDRESS
    // carries and no name does — so each hit proves its own field was read.
    expect(some(everyChild, child => has(child.email, "Atlas Labs"))).toBe(
      false
    );
    expect(some(everyChild, child => has(child.name, "billing@"))).toBe(false);

    rich.useActions().search("Atlas Labs");
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(filter(everyChild, child => has(child.name, "Atlas Labs")))
    );
    expect(size(wholeOf(rich))).toBe(1);

    rich.useActions().search("billing@");
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(filter(everyChild, child => has(child.email, "billing@")))
    );
    expect(size(wholeOf(rich))).toBe(1);

    rich.useActions().search(CLEARED);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyChild));

    // The brand managing nobody still declares the box, over an empty panel.
    expect(bare.useContext().isSearchable).toBe(true);
    expect(wholeOf(bare)).toEqual([]);
  });

  it("the tickets module's own reference and subject setters narrow the rows", () => {
    const pillar: Seam<
      { id: string; reference: string; subject: string },
      { reference: (v?: string) => void; subject: (v?: string) => void }
    > = ticketsCollection.resolve(hostgrid(), NO_CONTEXT);
    const tab: Seam<
      { id: string; reference: string; subject: string },
      { reference: (v?: string) => void; subject: (v?: string) => void }
    > = productTicketsCollection.resolve(hostgrid(), ANALYTICS_CONTEXT);
    const bare: Seam<
      { id: string; reference: string; subject: string },
      { reference: (v?: string) => void; subject: (v?: string) => void }
    > = ticketsCollection.resolve(minimal(), NO_CONTEXT);

    const everyThread = [...wholeOf(pillar)];
    const everyTabThread = [...wholeOf(tab)];
    expect(size(everyThread)).toBe(24);
    expect(size(everyTabThread)).toBe(14);

    // One published map, two mounts: the pillar's listing and the product tab.
    pillar.useActions().filters.reference("#4821");
    expect(size(wholeOf(pillar))).toBe(2);
    expect(idsOf(wholeOf(pillar))).toEqual(
      idsOf(filter(everyThread, ticket => has(ticket.reference, "#4821")))
    );
    pillar.useActions().filters.reference(undefined);

    pillar.useActions().filters.subject("invoice");
    expect(size(wholeOf(pillar))).toBe(2);
    expect(idsOf(wholeOf(pillar))).toEqual(
      idsOf(filter(everyThread, ticket => has(ticket.subject, "invoice")))
    );
    pillar.useActions().filters.subject(undefined);
    expect(idsOf(wholeOf(pillar))).toEqual(idsOf(everyThread));

    tab.useActions().filters.reference("#4818");
    expect(size(wholeOf(tab))).toBe(2);
    tab.useActions().filters.reference(undefined);
    tab.useActions().filters.subject("invoice");
    expect(size(wholeOf(tab))).toBe(1);
    expect(idsOf(wholeOf(tab))).toEqual(
      idsOf(filter(everyTabThread, ticket => has(ticket.subject, "invoice")))
    );
    tab.useActions().filters.subject(undefined);
    expect(idsOf(wholeOf(tab))).toEqual(idsOf(everyTabThread));

    expect(wholeOf(bare)).toEqual([]);
  });

  it("narrows the threads to the days they were opened in", () => {
    const mounts: Seam<
      { id: string; createdAt: string },
      { dateCreated: (v?: string) => void }
    >[] = [
      ticketsCollection.resolve(hostgrid(), NO_CONTEXT),
      productTicketsCollection.resolve(hostgrid(), ANALYTICS_CONTEXT)
    ];

    // BOTH mounts read the same window key, so neither can go inert alone.
    for (const seam of mounts) {
      const everyThread = [...wholeOf(seam)];
      const days = sortBy(uniq(map(everyThread, t => day(t.createdAt))));
      const from = days[1];
      const to = last(days);
      if (from === undefined || to === undefined) {
        throw new Error("the panel's threads span no days");
      }
      const raised = filter(everyThread, ticket =>
        inWindow(ticket.createdAt, from, to)
      );
      expect(size(raised)).toBeGreaterThan(0);
      expect(size(raised)).toBeLessThan(size(everyThread));

      seam.useActions().filters.dateCreated(range(from, to));
      expect(idsOf(wholeOf(seam))).toEqual(idsOf(raised));
      seam.useActions().filters.dateCreated(undefined);
      expect(idsOf(wholeOf(seam))).toEqual(idsOf(everyThread));

      seam.useActions().applyNamedFilter("dateCreated", range(from, to));
      expect(idsOf(wholeOf(seam))).toEqual(idsOf(raised));
      seam.useActions().applyNamedFilter("dateCreated", CLEARED);
      expect(idsOf(wholeOf(seam))).toEqual(idsOf(everyThread));
    }
  });

  it("searches the links by name and by where they point", () => {
    const rich: Seam<
      { id: string; name: string; redirectUrl: string },
      unknown
    > = affiliateLinksCollection.resolve(hostgrid(), NO_CONTEXT);
    const bare: Seam<
      { id: string; name: string; redirectUrl: string },
      unknown
    > = affiliateLinksCollection.resolve(minimal(), NO_CONTEXT);

    const everyLink = [...wholeOf(rich)];
    expect(size(everyLink)).toBe(24);
    expect(rich.useContext().isSearchable).toBe(true);

    // Each fragment lives in one field only, so a hit names the field read.
    expect(some(everyLink, link => has(link.redirectUrl, "conference"))).toBe(
      false
    );
    expect(some(everyLink, link => has(link.name, "domains"))).toBe(false);

    rich.useActions().search("Conference");
    expect(size(wholeOf(rich))).toBe(5);
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(filter(everyLink, link => has(link.name, "Conference")))
    );

    rich.useActions().search("domains");
    expect(size(wholeOf(rich))).toBe(5);
    expect(idsOf(wholeOf(rich))).toEqual(
      idsOf(filter(everyLink, link => has(link.redirectUrl, "domains")))
    );

    rich.useActions().search(CLEARED);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyLink));
    expect(wholeOf(bare)).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The maps that are DELIBERATELY narrower than the wire
// -----------------------------------------------------------------------------

describe("a panel publishes only the narrowings its own table offered", () => {
  beforeEach(bothSeeds);

  it("the statements panel still asks for the two ends of a period and nothing else", () => {
    const rich: Seam<
      { id: string; fromDate: string; toDate: string },
      { fromDate: (v?: string) => void; toDate: (v?: string) => void }
    > = creditStatementsCollection.resolve(hostgrid(), NO_CONTEXT);
    const bare: Seam<
      { id: string; fromDate: string; toDate: string },
      { fromDate: (v?: string) => void; toDate: (v?: string) => void }
    > = creditStatementsCollection.resolve(minimal(), NO_CONTEXT);

    const everyPeriod = [...wholeOf(rich)];
    expect(size(everyPeriod)).toBe(9);
    expect(keys(rich.useActions().filters)).toEqual(["fromDate", "toDate"]);

    const opening = sortBy(map(everyPeriod, "fromDate"))[1];
    if (opening === undefined) throw new Error("the ledger spans one period");
    const later = filter(everyPeriod, period => period.fromDate >= opening);

    rich.useActions().filters.fromDate(opening);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(later));
    expect(size(later)).toBeLessThan(size(everyPeriod));
    rich.useActions().filters.fromDate(undefined);
    expect(idsOf(wholeOf(rich))).toEqual(idsOf(everyPeriod));

    expect(wholeOf(bare)).toEqual([]);
  });

  it("the payout and commission maps carry no setter their tables never offered", () => {
    const payouts = affiliatePayoutsCollection
      .resolve(hostgrid(), NO_CONTEXT)
      .useActions();
    const commissions: { filters: AffiliateCommissionsFilters } =
      affiliateCommissionsCollection
        .resolve(hostgrid(), NO_CONTEXT)
        .useActions();

    expect(keys(payouts.filters)).toEqual(["datePaid"]);
    expect(keys(commissions.filters)).toEqual(["dateCreated"]);

    // Every declared setter is answered by a control or by a caller; a key
    // with neither is the seam this sweep exists to catch.
    expect(
      every(
        keys(commissions.filters),
        key => !includes(["paid", "destination"], key)
      )
    ).toBe(true);
    expect(
      controlKeys(affiliatePayoutsCollection.resolve(hostgrid(), NO_CONTEXT))
    ).not.toContain("destination");
    expect(
      controlKeys(
        affiliateCommissionsCollection.resolve(hostgrid(), NO_CONTEXT)
      )
    ).not.toContain("paid");
  });
});
