// -----------------------------------------------------------------------------
/**
 * @module tests/affiliate
 * @description Gap doc §4 "Affiliate": the programme's four states — off for
 * the brand, open to join, suspended, and running — and what an enrolled
 * affiliate is shown and may do. Only one state renders at a time, so the
 * whole page is graded as a MATRIX over the four datasets rather than one
 * panel at a time.
 *
 * Withdrawing and choosing a destination are forms (plan §6), so the page
 * must offer no verb for either: the verbs it emits are read back off the
 * config and the rows and closed against a declared set.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { AffiliatePayoutDestinationCode } from "@upmind-automation/types";
import { rowBinding, stringsIn } from "./support/page-config";
import {
  assign,
  compact,
  every,
  filter,
  find,
  includes,
  map,
  orderBy,
  size,
  some,
  uniq,
  values
} from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { MockAffiliate, MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  affiliateLinksCollection,
  affiliatePayoutsCollection,
  affiliateReferralsCollection
} from "~/portal/mock/collection-defs";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import {
  DATA_REF_ID,
  isDataRef,
  resolveDataRef
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  affiliateEnrolAction,
  affiliateIsDisabled,
  affiliateIsEnrolled,
  affiliateIsUnavailable,
  affiliateLinkHeadings,
  affiliateLinkItems,
  affiliateNeedsEnrolling,
  affiliatePayoutItems,
  affiliateReferralItems,
  affiliateSpecItems,
  affiliateStatItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_PAYOUT_STATUS } from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

/** The panels that only an enrolled, live affiliate is shown. */
const PROGRAMME_REFS: readonly string[] = [
  DATA_REF_ID.AFFILIATE_STAT_ITEMS,
  DATA_REF_ID.AFFILIATE_LINK_ITEMS,
  DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS,
  DATA_REF_ID.AFFILIATE_PAYOUT_ITEMS,
  // The destination panel binds its FORM's model now that one can save it
  // (plan F4); it stands and hides with the other four, as it always did.
  DATA_REF_ID.AFFILIATE_PAYOUT_FORM_MODEL
];

/**
 * Every verb the affiliate page may emit. The link dialogs and the withdrawal
 * request are reached through the shell's one form door (`open-form`), and
 * the destination panel carries its own submit — no other write is authored
 * on this surface.
 */
const PERMITTED_VERBS: readonly string[] = [
  MOCK_ACTION.NAVIGATE,
  MOCK_ACTION.COPY,
  MOCK_ACTION.OPEN_FORM,
  MOCK_ACTION.AFFILIATE_PAYOUT_DESTINATION_SAVE,
  MOCK_ACTION.AFFILIATE_ENROL,
  MOCK_ACTION.AFFILIATE_LINK_REMOVE,
  MOCK_ACTION.AFFILIATE_LINK_REMOVE_CONFIRMED,
  MOCK_ACTION.COLLECTION_SEARCH,
  MOCK_ACTION.COLLECTION_SORT,
  MOCK_ACTION.COLLECTION_FILTER,
  MOCK_ACTION.SET_PAGE_SIZE,
  MOCK_ACTION.SET_VIEW,
  MOCK_ACTION.PAGE_NEXT,
  MOCK_ACTION.PAGE_PREV
];

const KNOWN_VERBS: string[] = values(MOCK_ACTION);

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function programme(data: MockDataset): MockAffiliate {
  if (data.affiliate === null) throw new Error("dataset runs no programme");
  return data.affiliate;
}

function notEnrolled(): MockDataset {
  const data = clone();
  assign(programme(data), { enrolled: false, since: undefined });
  return data;
}

function suspended(): MockDataset {
  const data = clone();
  assign(programme(data), { disabled: true });
  return data;
}

function affiliatePage(): ConfigNode {
  const page = accountPages()[PAGE_KEY.ACCOUNT_AFFILIATE];
  if (page === undefined) throw new Error("no affiliate page config");
  return page;
}

function panelRow(refId: string): ConfigNode {
  const row = rowBinding(affiliatePage(), refId);
  if (row === undefined) throw new Error(`no affiliate row binds ${refId}`);
  return row;
}

/** Whether one panel stands for this dataset — an unconditional row always does. */
function shows(refId: string, data: MockDataset): boolean {
  const ref = panelRow(refId).visible;
  if (!isDataRef(ref)) return true;
  return resolveDataRef(ref, data, {}) === true;
}

function programmeShows(data: MockDataset): boolean[] {
  return map(PROGRAMME_REFS, refId => shows(refId, data));
}

/** Every fragment the page offers as a landing place. */
function pageAnchors(): string[] {
  const rows = affiliatePage().rows;
  if (!Array.isArray(rows)) throw new Error("the page authors no rows");
  return compact(
    map(rows, row => {
      if (row === null || typeof row !== "object") return undefined;
      const anchor = Reflect.get(row, "anchor");
      if (typeof anchor !== "string") return undefined;
      return anchor;
    })
  );
}

function fragmentOf(to: string | undefined): string {
  return (to ?? "").split("#")[1] ?? "";
}

function tileFor(data: MockDataset, formatted: string) {
  return find(
    affiliateStatItems(data),
    tile => String(tile.value) === formatted
  );
}

function figures(data: MockDataset): string[] {
  return map(affiliateStatItems(data), tile =>
    String(tile.value).replace(/,/g, "")
  );
}

function rowActionValues(row: {
  action?: { value: string };
  moreActions?: readonly { value: string }[];
}): string[] {
  return [
    ...map(row.moreActions ?? [], "value"),
    ...(row.action === undefined ? [] : [row.action.value])
  ];
}

function verbsIn(texts: readonly string[]): string[] {
  return uniq(
    compact(
      map(texts, text => {
        const verb = text.split(":")[0];
        if (!includes(KNOWN_VERBS, verb)) return undefined;
        return verb;
      })
    )
  );
}

/** Every string the affiliate surface authors or emits, config and rows alike. */
function affiliateStrings(data: MockDataset): string[] {
  return [
    ...stringsIn(affiliatePage()),
    ...stringsIn(affiliateStatItems(data)),
    ...stringsIn(affiliateLinkItems(data)),
    ...stringsIn(affiliateReferralItems(data)),
    ...stringsIn(affiliatePayoutItems(data)),
    ...stringsIn(affiliateSpecItems(data)),
    ...stringsIn(affiliateEnrolAction(data))
  ];
}

/** Every referral the collection holds, page by page. */
function everyReferral(
  instance: ReturnType<typeof affiliateReferralsCollection.resolve>
) {
  const { data, pagination } = instance.useContext();
  const actions = instance.useActions();
  while (pagination.value.page > 1) actions.prevPage();
  const rows = [];
  for (let page = 1; page <= pagination.value.pages; page += 1) {
    rows.push(...data.value);
    actions.nextPage();
  }
  while (pagination.value.page > 1) actions.prevPage();
  return rows;
}

/**
 * Widens a paged panel to its whole set. The links and payouts tables page
 * now (plan F11), and these read what the WHOLE table carries rather than
 * whichever ten rows the first page happens to hold.
 */
function widen(
  definition:
    | typeof affiliateLinksCollection
    | typeof affiliatePayoutsCollection,
  data: MockDataset
): void {
  const instance = definition.resolve(data, {});
  instance
    .useActions()
    .setLimit(Math.max(instance.useContext().pagination.value.total, 1));
}

/** The order both padded tables open in — the collection's own "Newest first". */
function newestFirst<TRow>(
  rows: readonly TRow[],
  key: ((row: TRow) => string) | string = "createdAt"
): TRow[] {
  return orderBy(rows, [key], ["desc"]);
}

function payoutDay(payout: { paidAt?: string; requestedAt: string }): string {
  return payout.paidAt ?? payout.requestedAt;
}

function referralFilterValue(key: string, value: string): string {
  return `${mockActionValue(
    MOCK_ACTION.COLLECTION_FILTER,
    PAGED_COLLECTION_ID.AFFILIATE_REFERRALS
  )}:${key}:${value}`;
}

describe("the programme renders one state at a time", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("shows an enrolled affiliate its programme and neither notice", () => {
    const data = clone();

    expect(affiliateIsEnrolled(data)).toBe(true);
    expect(programmeShows(data)).toEqual(map(PROGRAMME_REFS, () => true));
    expect(shows(DATA_REF_ID.AFFILIATE_ENROL_ACTION, data)).toBe(false);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_DISABLED, data)).toBe(false);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_UNAVAILABLE, data)).toBe(false);
  });

  it("offers only the way in to a client who has not joined", () => {
    const data = notEnrolled();

    expect(affiliateNeedsEnrolling(data)).toBe(true);
    expect(affiliateIsEnrolled(data)).toBe(false);
    expect(programmeShows(data)).toEqual(map(PROGRAMME_REFS, () => false));
    expect(shows(DATA_REF_ID.AFFILIATE_ENROL_ACTION, data)).toBe(true);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_DISABLED, data)).toBe(false);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_UNAVAILABLE, data)).toBe(false);
  });

  it("says only that the account is suspended where the brand has suspended it", () => {
    const data = suspended();

    expect(affiliateIsDisabled(data)).toBe(true);
    expect(programmeShows(data)).toEqual(map(PROGRAMME_REFS, () => false));
    expect(shows(DATA_REF_ID.AFFILIATE_ENROL_ACTION, data)).toBe(false);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_DISABLED, data)).toBe(true);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_UNAVAILABLE, data)).toBe(false);
  });

  it("says only that the brand runs no programme where the gate is off", () => {
    const data = minimal();

    expect(affiliateIsUnavailable(data)).toBe(true);
    expect(affiliateIsEnrolled(data)).toBe(false);
    expect(affiliateNeedsEnrolling(data)).toBe(false);
    expect(affiliateIsDisabled(data)).toBe(false);
    expect(programmeShows(data)).toEqual(map(PROGRAMME_REFS, () => false));
    expect(shows(DATA_REF_ID.AFFILIATE_ENROL_ACTION, data)).toBe(false);
    expect(shows(DATA_REF_ID.AFFILIATE_IS_UNAVAILABLE, data)).toBe(true);
  });
});

describe("joining the programme", () => {
  it("enrols the client, dates the membership and says so", () => {
    const data = notEnrolled();

    const result = dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.AFFILIATE_ENROL)
    );

    expect(programme(data).enrolled).toBe(true);
    expect(programme(data).since).toBeTruthy();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(affiliateNeedsEnrolling(data)).toBe(false);
    expect(shows(DATA_REF_ID.AFFILIATE_ENROL_ACTION, data)).toBe(false);
    expect(programmeShows(data)).toEqual(map(PROGRAMME_REFS, () => true));
  });
});

describe("the stats grid reports the figures the programme was given", () => {
  it("states each balance and count as the seed holds it", () => {
    const data = clone();
    const { stats } = programme(data);
    const stated = figures(data);

    expect(stated).toContain(stats.pendingBalance.formatted);
    expect(stated).toContain(stats.availableBalance.formatted);
    expect(stated).toContain(stats.withdrawnBalance.formatted);
    expect(stated).toContain(String(stats.visits));
    expect(stated).toContain(String(stats.referrals));
    expect(
      every(affiliateStatItems(data), tile => tile.label.trim().length > 0)
    ).toBe(true);
  });

  it("points the two live balances at the lists that explain them", () => {
    const data = clone();
    const { stats } = programme(data);
    const anchors = pageAnchors();

    expect(anchors.length).toBeGreaterThan(0);
    for (const balance of [stats.pendingBalance, stats.availableBalance]) {
      const tile = tileFor(data, balance.formatted);
      expect(tile?.to).toBeTruthy();
      expect(anchors).toContain(fragmentOf(tile?.to));
    }
  });
});

describe("the referral links table", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("carries one row per link, each offering its address and its removal", () => {
    const data = clone();
    const { links } = programme(data);
    widen(affiliateLinksCollection, data);
    const rows = affiliateLinkItems(data);

    expect(size(links)).toBeGreaterThan(1);
    // In the order the panel opens in — newest first — not merely the same set.
    expect(map(rows, "id")).toEqual(map(newestFirst(links), "id"));
    expect(affiliateLinkHeadings().length).toBeGreaterThan(0);
    for (const link of links) {
      const row = find(rows, { id: link.id });
      expect(stringsIn(row).join(" ")).toContain(link.name);
      expect(rowActionValues(row ?? {})).toContain(
        mockActionValue(MOCK_ACTION.COPY, link.url)
      );
      expect(rowActionValues(row ?? {})).toContain(
        mockActionValue(MOCK_ACTION.AFFILIATE_LINK_REMOVE, link.id)
      );
    }
  });

  it("asks before deleting a link, and deletes only the one asked about", () => {
    const data = clone();
    const target = programme(data).links[0];
    if (target === undefined) throw new Error("seed carries no referral link");
    const others = map(
      filter(programme(data).links, link => link.id !== target.id),
      "id"
    );

    const asked = dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.AFFILIATE_LINK_REMOVE, target.id)
    );

    expect(asked?.confirm?.destructive).toBe(true);
    expect(map(programme(data).links, "id")).toContain(target.id);

    const confirmed = dispatchMockAction(data, {}, asked?.confirm?.then ?? "");
    widen(affiliateLinksCollection, data);

    expect(map(programme(data).links, "id")).toEqual(others);
    expect(map(affiliateLinkItems(data), "id")).toEqual(
      map(newestFirst(programme(data).links), "id")
    );
    expect(confirmed?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});

describe("the referrals table pages and narrows by the link that brought them in", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("opens at the standard page size and narrows the whole set by link", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const referrals = programme(data).referrals;
    const instance = affiliateReferralsCollection.resolve(data, {});
    const { pagination } = instance.useContext();
    const linkId = referrals[0]?.linkId;
    if (linkId === undefined) throw new Error("seed carries no referrals");
    const brought = filter(referrals, { linkId });

    expect(pagination.value.limit).toBe(MOCK_PAGE_LIMIT);
    expect(pagination.value.total).toBe(size(referrals));
    expect(pagination.value.total).toBeGreaterThan(MOCK_PAGE_LIMIT);
    expect(pagination.value.pages).toBe(
      Math.ceil(size(referrals) / MOCK_PAGE_LIMIT)
    );
    expect(instance.useContext().data.value).toHaveLength(MOCK_PAGE_LIMIT);

    dispatchMockAction(data, {}, referralFilterValue("linkId", linkId));

    expect(pagination.value.total).toBe(size(brought));
    expect(map(everyReferral(instance), "id").sort()).toEqual(
      map(brought, "id").sort()
    );

    dispatchMockAction(data, {}, referralFilterValue("linkId", ""));

    expect(pagination.value.total).toBe(size(referrals));
  });

  it("shows each referral as the anonymised row legacy showed", () => {
    const data = clone();
    const rows = affiliateReferralItems(data);
    const referrals = programme(data).referrals;

    // The table opens on the day each referral landed, newest first (plan F16
    // O-10), so the first page is the head of THAT order, not of the seed's.
    expect(map(rows, "id")).toEqual(
      map(orderBy(referrals, ["date"], ["desc"]).slice(0, size(rows)), "id")
    );
    for (const row of rows) {
      const referral = find(referrals, { id: row.id });
      expect(stringsIn(row).join(" ")).toContain(referral?.client);
    }
  });
});

describe("the payout history states where each transfer went and how it went", () => {
  it("carries the amount and the standing of every payout, and the reason the failed one gives", () => {
    const data = clone();
    const payouts = programme(data).payouts;
    widen(affiliatePayoutsCollection, data);
    const rows = affiliatePayoutItems(data);
    const shown = filter(payouts, payout => some(rows, { id: payout.id }));
    const failed = find(shown, { status: MOCK_PAYOUT_STATUS.FAILED });
    if (failed === undefined) throw new Error("seed shows no failed payout");

    expect(map(rows, "id")).toEqual(map(newestFirst(payouts, payoutDay), "id"));
    for (const payout of shown) {
      const row = find(rows, { id: payout.id });
      expect(stringsIn(row).join(" ")).toContain(payout.amount.formatted);
      expect(row?.status?.label).toBeTruthy();
    }
    expect(stringsIn(find(rows, { id: failed.id })).join(" ")).toContain(
      failed.error
    );
    expect(
      uniq(
        map(
          filter(rows, row => row.status !== undefined),
          row => row.status?.label
        )
      ).length
    ).toBeGreaterThan(1);
  });

  it("reads the destination off the payout rather than wording one for all of them", () => {
    const data = clone();
    const moved = clone();
    const payout = programme(moved).payouts[0];
    if (payout === undefined) throw new Error("seed carries no payout");
    const elsewhere = find(
      values(AffiliatePayoutDestinationCode),
      code => code !== payout.destination
    );
    assign(payout, { destination: elsewhere });

    const before = stringsIn(
      find(affiliatePayoutItems(data), { id: payout.id })
    ).join(" ");
    const after = stringsIn(
      find(affiliatePayoutItems(moved), { id: payout.id })
    ).join(" ");

    expect(before).not.toBe(after);
  });
});

describe("where withdrawals are sent is stated, never chosen", () => {
  it("states the destination the account holds, and follows it when it moves", () => {
    const data = clone();
    const moved = clone();
    const stated = stringsIn(affiliateSpecItems(data)).join(" ");

    expect(stated).toContain(programme(data).payoutDestination.detail);

    assign(programme(moved).payoutDestination, {
      detail: "treasury@somewhere-else.example"
    });

    expect(stringsIn(affiliateSpecItems(moved)).join(" ")).toContain(
      "treasury@somewhere-else.example"
    );
    expect(stringsIn(affiliateSpecItems(moved)).join(" ")).not.toBe(stated);
  });

  it("offers no verb beyond the ones this surface is allowed", () => {
    const running = verbsIn(affiliateStrings(clone()));
    const joining = verbsIn(affiliateStrings(notEnrolled()));

    expect(filter(running, verb => !includes(PERMITTED_VERBS, verb))).toEqual(
      []
    );
    expect(filter(joining, verb => !includes(PERMITTED_VERBS, verb))).toEqual(
      []
    );
    expect(running).toContain(MOCK_ACTION.COPY);
    expect(running).toContain(MOCK_ACTION.AFFILIATE_LINK_REMOVE);
    expect(joining).toContain(MOCK_ACTION.AFFILIATE_ENROL);
  });
});
