// -----------------------------------------------------------------------------
/**
 * @module tests/eighth-closure
 * @description Phase F12: the six client capabilities the eighth audit read as
 * open, and the one over-build it read as the desk's. The delegates, login and
 * ticket panels carry the narrowings legacy's own listings did (E1-E3); a new
 * referral link opens on the brand's default redirect and states the rule over
 * the field (E4); the two-factor dialog states the setup key and the address an
 * authenticator enrols from, and turning it off asks for a code as turning it
 * on does (E5, E6); and the message preview drops the resent-from/resent-as
 * trail, which was staff bookkeeping (E7).
 *
 * Every expectation derives from the shipped seed or from the contract's own
 * filter vocabulary — no ordering is graded against a list this file authors,
 * and the sorts are graded by the ORDER they produce rather than by the name
 * they carry, so a renamed option cannot pass a broken one. Gates are graded on
 * both seeds where the seed applies.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";
import { stringsIn } from "./support/page-config";
import {
  compact,
  every,
  filter,
  find,
  first,
  get,
  includes,
  isString,
  last,
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
import type { ClientLoginAttemptsFilters } from "~/portal/mock/contracts/client-login-attempts";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockAffiliateLink,
  MockDataset,
  MockDelegate,
  MockLoginAttempt,
  MockTicket
} from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  accountDelegatesCollection,
  loginAttemptsCollection,
  ticketsCollection
} from "~/portal/mock/collection-defs";
import {
  MOCK_ACCESS_TYPE,
  MOCK_FILTER_FLAG
} from "~/portal/mock/collection-filters";
import { twoFactorDefaults } from "~/portal/mock/contracts/auth.schemas.twofa";
import * as affiliateSchemas from "~/portal/mock/contracts/client-affiliate.schemas";
import { DATA_REF_ID } from "~/portal/mock/data-refs";
import { useMockSecurity } from "~/portal/mock/facades";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { affiliateLinkContext } from "~/portal/mock/forms/account-contexts";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import {
  BRAND_GATE_CONFIG_KEY,
  MOCK_DELEGATE_STATUS
} from "~/portal/mock/types";
import {
  LIST_CONTROLS_FILTER_KIND,
  LIST_CONTROLS_RANGE_SEPARATOR
} from "~/portal/modules/list-controls/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const SIX_DIGITS = "123456";

const CLEARED = "";

/** The month seven of the log's twenty-four sign-in attempts were tried in. */
const AUGUST_FIRST = "2026-08-01";
const AUGUST_LAST = "2026-08-31";

/** The redirect the brand publishes for a new link, and the host it names. */
const HOSTGRID_DEFAULT_REDIRECT = "https://hostgrid.example/pricing";

/** A redirect on somebody else's host — legacy's field took it, so this one does. */
const OFF_BRAND_REDIRECT = "https://kiln.example/reviews";

/**
 * One paged collection, typed off the members this file uses rather than off
 * `MockCollection`, so each definition's own filter and sort generics are
 * carried through (the seventh closure's own `wholeOf` precedent).
 */
type PagedHandle<TRow> = {
  useActions: () => {
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

function payload(verb: string, model: unknown, id?: string): string {
  const tail = JSON.stringify(model);
  if (id === undefined) return `${verb}:${tail}`;
  return `${verb}:${id}:${tail}`;
}

/** Every row the collection holds, by widening its page to the whole. */
function wholeOf<TRow>(handle: PagedHandle<TRow>): TRow[] {
  const view = handle.useContext();
  handle.useActions().setLimit(Math.max(view.pagination.value.total, 1));
  return view.data.value;
}

function controlKeys<TRow>(handle: PagedHandle<TRow>): string[] {
  return map(handle.useContext().filterControls, "key");
}

/** The one control asking a range of days, whatever the definition named it. */
function rangeControlKey<TRow>(handle: PagedHandle<TRow>): string | undefined {
  return find(handle.useContext().filterControls, {
    kind: LIST_CONTROLS_FILTER_KIND.DATE_RANGE
  })?.key;
}

function range(from: string, to: string): string {
  return `${from}${LIST_CONTROLS_RANGE_SEPARATOR}${to}`;
}

/** The whole set under one named narrowing, with the narrowing cleared after. */
function narrowedBy<TRow>(
  handle: PagedHandle<TRow>,
  key: string,
  value: string
): TRow[] {
  handle.useActions().applyNamedFilter(key, value);
  const rows = wholeOf(handle);
  handle.useActions().applyNamedFilter(key, CLEARED);
  return rows;
}

/** The whole set under a search, with the search cleared after. */
function foundBy<TRow>(handle: PagedHandle<TRow>, text: string): TRow[] {
  handle.useActions().search(text);
  const rows = wholeOf(handle);
  handle.useActions().search(CLEARED);
  return rows;
}

/** Every order this panel offers, keyed by the option that produced it. */
function orderingsOf<TRow>(handle: PagedHandle<TRow>): Record<string, TRow[]> {
  const orders: Record<string, TRow[]> = {};
  for (const option of handle.useContext().sortOptions) {
    handle.useActions().applySort(option.value);
    orders[option.value] = [...wholeOf(handle)];
  }
  handle.useActions().applySort(CLEARED);
  return orders;
}

/** How many times a run of flags changes value — 0 or 1 is one clean group. */
function switchCount(flags: readonly boolean[]): number {
  return size(
    filter(flags, (flag, index) => index > 0 && flags[index - 1] !== flag)
  );
}

function isGrouped(flags: readonly boolean[]): boolean {
  return switchCount(flags) <= 1;
}

/** Whether a run of comparable values only ever moves one way. */
function isMonotone(values_: readonly string[]): boolean {
  const rises = every(
    values_,
    (value, index) => index === 0 || (values_[index - 1] ?? "") <= value
  );
  const falls = every(
    values_,
    (value, index) => index === 0 || (values_[index - 1] ?? "") >= value
  );
  return rises || falls;
}

function neverRises(values_: readonly string[]): boolean {
  return every(
    values_,
    (value, index) => index === 0 || (values_[index - 1] ?? "") >= value
  );
}

function idsOf<TRow extends { id: string }>(rows: readonly TRow[]): string[] {
  return sortBy(map(rows, "id"));
}

/** The day part of a stamp — the unit a "created between" window is asked in. */
function day(stamp: string): string {
  return stamp.slice(0, 10);
}

// -----------------------------------------------------------------------------
// E1 — the delegates toolbar
// -----------------------------------------------------------------------------

function delegatesPanel(data: MockDataset): PagedHandle<MockDelegate> {
  return accountDelegatesCollection.resolve(data);
}

function isAccepted(delegate: MockDelegate): boolean {
  return delegate.status === MOCK_DELEGATE_STATUS.ACCEPTED;
}

function isFull(delegate: MockDelegate): boolean {
  return delegate.isFullDelegate === true;
}

describe("E1 — the delegates panel narrows and orders like every other one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks the three questions the contract names, and takes a search", () => {
    const handle = delegatesPanel(hostgrid());

    expect(handle.useContext().isSearchable).toBe(true);
    expect(controlKeys(handle)).toEqual(
      expect.arrayContaining(["active", "isFullDelegate", "accessType"])
    );
  });

  it("finds a delegate by the name typed, and by the address", () => {
    const data = hostgrid();
    const handle = delegatesPanel(data);
    const seeded = find(data.delegates, { id: "dlg-1" });
    if (seeded === undefined) throw new Error("seed carries no dlg-1");

    // A fragment of the NAME that no address holds, and one of the ADDRESS
    // that no name holds — so each hit proves its own field was searched.
    const nameFragment = last(seeded.name.split(" ")) ?? "";
    const addressFragment = seeded.email.split("@")[1] ?? "";
    const byName = filter(data.delegates, delegate =>
      includes(toLower(delegate.name), toLower(nameFragment))
    );
    const byAddress = filter(data.delegates, delegate =>
      includes(toLower(delegate.email), toLower(addressFragment))
    );

    expect(nameFragment).toBeTruthy();
    expect(addressFragment).toBeTruthy();
    expect(size(byName)).toBeGreaterThan(0);
    expect(size(byName)).toBeLessThan(size(data.delegates));
    expect(
      some(data.delegates, delegate =>
        includes(toLower(delegate.email), toLower(nameFragment))
      )
    ).toBe(false);
    expect(
      some(data.delegates, delegate =>
        includes(toLower(delegate.name), toLower(addressFragment))
      )
    ).toBe(false);

    expect(idsOf(foundBy(handle, nameFragment))).toEqual(idsOf(byName));
    expect(idsOf(foundBy(handle, addressFragment))).toEqual(idsOf(byAddress));
    expect(idsOf(wholeOf(handle))).toEqual(idsOf(data.delegates));
  });

  it("narrows to the invitations taken up, and to whole-account access", () => {
    const data = hostgrid();
    const handle = delegatesPanel(data);
    const accepted = filter(data.delegates, isAccepted);
    const pending = reject(data.delegates, isAccepted);
    const full = filter(data.delegates, isFull);
    const specific = reject(data.delegates, isFull);

    expect(size(accepted)).toBeGreaterThan(0);
    expect(size(pending)).toBeGreaterThan(0);
    expect(size(full)).toBeGreaterThan(0);
    expect(size(specific)).toBeGreaterThan(0);

    expect(idsOf(narrowedBy(handle, "active", MOCK_FILTER_FLAG.YES))).toEqual(
      idsOf(accepted)
    );
    expect(idsOf(narrowedBy(handle, "active", MOCK_FILTER_FLAG.NO))).toEqual(
      idsOf(pending)
    );
    expect(
      idsOf(narrowedBy(handle, "isFullDelegate", MOCK_FILTER_FLAG.YES))
    ).toEqual(idsOf(full));
    expect(
      idsOf(narrowedBy(handle, "isFullDelegate", MOCK_FILTER_FLAG.NO))
    ).toEqual(idsOf(specific));

    // The access switch stands beside the new pair and still answers the
    // same axis — the two doors agree rather than one replacing the other.
    expect(
      idsOf(narrowedBy(handle, "accessType", MOCK_ACCESS_TYPE.FULL))
    ).toEqual(idsOf(full));
    expect(
      idsOf(narrowedBy(handle, "accessType", MOCK_ACCESS_TYPE.SPECIFIC))
    ).toEqual(idsOf(specific));
  });

  it("opens on the recently invited, and orders by standing and by access", () => {
    const data = hostgrid();
    const handle = delegatesPanel(data);

    // The seed is grouped by NEITHER axis, so a grouped result is the sort's
    // doing rather than the order the rows were written in.
    expect(isGrouped(map(data.delegates, isAccepted))).toBe(false);
    expect(isGrouped(map(data.delegates, isFull))).toBe(false);

    expect(neverRises(map(wholeOf(handle), "invitedAt"))).toBe(true);
    expect(handle.useContext().activeSort.value).toBeTruthy();

    const orders = values(orderingsOf(handle));
    expect(size(orders)).toBe(3);
    expect(some(orders, rows => neverRises(map(rows, "invitedAt")))).toBe(true);
    expect(some(orders, rows => isGrouped(map(rows, isAccepted)))).toBe(true);
    expect(some(orders, rows => isGrouped(map(rows, isFull)))).toBe(true);
  });

  it("dates every delegation the seed carries, and every one invited since", () => {
    const data = hostgrid();
    const before = size(data.delegates);

    // More rows than the page holds, so the padded rows are graded too.
    expect(before).toBeGreaterThan(
      delegatesPanel(data).useContext().pagination.value.limit
    );
    expect(
      every(
        data.delegates,
        delegate => isString(delegate.invitedAt) && delegate.invitedAt !== ""
      )
    ).toBe(true);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.DELEGATE_INVITE, {
        email: "wren@fieldnotes.app",
        accessType: "full",
        productIds: [],
        ticketIds: []
      })
    );

    const invited = find(data.delegates, { email: "wren@fieldnotes.app" });
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(size(data.delegates)).toBe(before + 1);
    expect(invited?.invitedAt).toBe(new Date().toISOString().slice(0, 10));
  });
});

// -----------------------------------------------------------------------------
// E2 — the login attempts toolbar
// -----------------------------------------------------------------------------

function attemptsPanel(data: MockDataset): PagedHandle<MockLoginAttempt> {
  return loginAttemptsCollection.resolve(data);
}

describe("E2 — the login log is searched by address and ordered three ways", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("finds every attempt from one address, by part of it", () => {
    const data = hostgrid();
    const handle = attemptsPanel(data);
    const seeded = find(data.loginAttempts, { id: "log-3" });
    if (seeded === undefined) throw new Error("seed carries no log-3");

    // The first three octets: a fragment, so a hit proves a CONTAINS match
    // rather than an equality one, and one no device string carries.
    const fragment = seeded.ip.split(".").slice(0, 3).join(".");
    const fromThere = filter(data.loginAttempts, attempt =>
      includes(attempt.ip, fragment)
    );

    expect(size(fromThere)).toBeGreaterThan(1);
    expect(size(fromThere)).toBeLessThan(size(data.loginAttempts));
    expect(
      some(data.loginAttempts, attempt => includes(attempt.device, fragment))
    ).toBe(false);
    expect(handle.useContext().isSearchable).toBe(true);
    expect(idsOf(foundBy(handle, fragment))).toEqual(idsOf(fromThere));
    expect(idsOf(wholeOf(handle))).toEqual(idsOf(data.loginAttempts));
  });

  it("orders by the day, by the address and by how the attempt ended", () => {
    const data = hostgrid();
    const handle = attemptsPanel(data);

    // None of the three holds in the order the rows were written in.
    expect(isMonotone(map(data.loginAttempts, "at"))).toBe(false);
    expect(isMonotone(map(data.loginAttempts, "ip"))).toBe(false);
    expect(isGrouped(map(data.loginAttempts, "succeeded"))).toBe(false);

    const orders = values(orderingsOf(handle));
    expect(size(orders)).toBe(3);
    expect(some(orders, rows => isMonotone(map(rows, "at")))).toBe(true);
    expect(some(orders, rows => isMonotone(map(rows, "ip")))).toBe(true);
    expect(some(orders, rows => isGrouped(map(rows, "succeeded")))).toBe(true);
  });

  it("still narrows by how the attempt ended, and to a window of days", () => {
    const data = hostgrid();
    const handle = attemptsPanel(data);
    const dateKey = rangeControlKey(handle);
    const outcomeKey = first(
      reject(controlKeys(handle), key => key === dateKey)
    );
    if (dateKey === undefined) throw new Error("the log asks for no window");
    if (outcomeKey === undefined) throw new Error("the log asks no outcome");

    const succeeded = filter(data.loginAttempts, { succeeded: true });
    const failed = filter(data.loginAttempts, { succeeded: false });
    expect(size(succeeded)).toBeGreaterThan(0);
    expect(size(failed)).toBeGreaterThan(0);
    expect(idsOf(narrowedBy(handle, outcomeKey, MOCK_FILTER_FLAG.YES))).toEqual(
      idsOf(succeeded)
    );
    expect(idsOf(narrowedBy(handle, outcomeKey, MOCK_FILTER_FLAG.NO))).toEqual(
      idsOf(failed)
    );

    const days = sortBy(
      uniq(map(data.loginAttempts, attempt => day(attempt.at)))
    );
    const from = days[1];
    const to = last(days);
    if (from === undefined || to === undefined) {
      throw new Error("the log spans no days");
    }
    const inWindow = filter(
      data.loginAttempts,
      attempt => day(attempt.at) >= from && day(attempt.at) <= to
    );

    expect(size(inWindow)).toBeLessThan(size(data.loginAttempts));
    expect(idsOf(narrowedBy(handle, dateKey, range(from, to)))).toEqual(
      idsOf(inWindow)
    );
  });

  it("the sign-in log's own successful and dateCreated setters narrow the rows", () => {
    // Counted off the shipped log by hand rather than re-derived with the
    // predicate under test: twenty-four attempts, seventeen of which got in,
    // and the seven tried in August (the padded rows run back from July, so
    // none of them lands in that month). Both brands carry the same log.
    for (const data of [hostgrid(), minimal()]) {
      const handle = attemptsPanel(data);
      const filters: ClientLoginAttemptsFilters = loginAttemptsCollection
        .resolve(data)
        .useActions().filters;

      expect(size(data.loginAttempts)).toBe(24);
      expect(size(wholeOf(handle))).toBe(24);

      filters.successful(true);
      expect(size(wholeOf(handle))).toBe(17);
      filters.successful(false);
      expect(size(wholeOf(handle))).toBe(7);
      filters.successful(undefined);
      expect(size(wholeOf(handle))).toBe(24);

      filters.dateCreated(range(AUGUST_FIRST, AUGUST_LAST));
      expect(size(wholeOf(handle))).toBe(7);
      filters.dateCreated(undefined);
      expect(size(wholeOf(handle))).toBe(24);
    }
  });
});

// -----------------------------------------------------------------------------
// E3 — the tickets panel's created window
// -----------------------------------------------------------------------------

function ticketsPanel(data: MockDataset): PagedHandle<MockTicket> {
  return ticketsCollection.resolve(data, NO_CONTEXT);
}

describe("E3 — the tickets panel asks which days a thread was raised on", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("carries the created range beside the narrowings it already had", () => {
    const handle = ticketsPanel(hostgrid());
    const control = find(handle.useContext().filterControls, {
      key: "dateCreated"
    });

    expect(control?.kind).toBe(LIST_CONTROLS_FILTER_KIND.DATE_RANGE);
    expect(control?.label).toBeTruthy();
    // Legacy's only other client narrowing is the status; a tab holding one
    // status offers no control for it, so nothing else need stand here.
    expect(
      every(
        reject(controlKeys(handle), key => key === "dateCreated"),
        key => key === "status"
      )
    ).toBe(true);
  });

  it("narrows to the window, and leaves the other narrowings alone", () => {
    const handle = ticketsPanel(hostgrid());
    // The panel's OWN unnarrowed set, not the whole seed: the threads listing
    // opens on a status the seed's closed rows sit outside of.
    const everyThread = [...wholeOf(handle)];
    const days = sortBy(
      uniq(map(everyThread, ticket => day(ticket.createdAt)))
    );
    const from = days[1];
    const to = last(days);
    if (from === undefined || to === undefined) {
      throw new Error("the panel's threads span no days");
    }
    const raised = filter(
      everyThread,
      ticket => day(ticket.createdAt) >= from && day(ticket.createdAt) <= to
    );

    expect(size(raised)).toBeGreaterThan(0);
    expect(size(raised)).toBeLessThan(size(everyThread));

    handle.useActions().applyNamedFilter("dateCreated", range(from, to));
    expect(idsOf(wholeOf(handle))).toEqual(idsOf(raised));

    // Every other control still reads as narrowing nothing — the window is
    // one question added, not a toolbar rewritten.
    const applied = handle.useContext().appliedFilters.value;
    const others = reject(controlKeys(handle), key => key === "dateCreated");
    for (const key of others) expect(applied[key]).toBe(CLEARED);

    handle.useActions().applyNamedFilter("dateCreated", CLEARED);
    expect(idsOf(wholeOf(handle))).toEqual(idsOf(everyThread));
  });
});

// -----------------------------------------------------------------------------
// E4 — where a new referral link points
// -----------------------------------------------------------------------------

function affiliateLinks(data: MockDataset): MockAffiliateLink[] {
  if (data.affiliate === null) throw new Error("seed carries no affiliate");
  return data.affiliate.links;
}

function linkDescription(data: MockDataset): string {
  return String(
    get(
      affiliateSchemas.useLinkSchema(affiliateLinkContext(data)),
      "properties.redirectUrl.description"
    )
  );
}

describe("E4 — a new referral link opens on the brand's own redirect", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("reads the platform's own key for it, and the seeds sit either side", () => {
    expect(BRAND_GATE_CONFIG_KEY.AFFILIATES_DEFAULT_REDIRECT_LINK).toBe(
      BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK
    );
    expect(hostgrid().features.AFFILIATES_DEFAULT_REDIRECT_LINK).toBe(
      HOSTGRID_DEFAULT_REDIRECT
    );
    expect(minimal().features.AFFILIATES_DEFAULT_REDIRECT_LINK).toBeUndefined();
  });

  it("fills the field where the brand publishes one, and leaves it empty where it does not", () => {
    expect(
      affiliateSchemas.linkDefaults(affiliateLinkContext(hostgrid()))
    ).toEqual({
      redirectUrl: HOSTGRID_DEFAULT_REDIRECT,
      name: ""
    });
    expect(
      affiliateSchemas.linkDefaults(affiliateLinkContext(minimal()))
    ).toEqual({
      redirectUrl: CLEARED,
      name: ""
    });
  });

  it("states the brand-domain instruction over the field, on either brand", () => {
    // The instruction is unconditional words, so the brand publishing NO
    // default states it exactly as the one publishing a default does.
    for (const data of [hostgrid(), minimal()]) {
      expect(linkDescription(data)).toMatch(/domain/i);
      expect(linkDescription(data)).toContain(data.brand.name);
    }
  });

  it("insists the field says something, and takes whatever host it names", () => {
    const validate = usePortalAjv().compile(
      affiliateSchemas.useLinkSchema(affiliateLinkContext(hostgrid()))
    );

    expect(validate({ redirectUrl: OFF_BRAND_REDIRECT })).toBe(true);
    expect(validate({ redirectUrl: HOSTGRID_DEFAULT_REDIRECT })).toBe(true);
    expect(validate({ redirectUrl: CLEARED })).toBe(false);
    expect(validate({ name: "Newsletter" })).toBe(false);
  });

  it("mints and re-points a link on another host, and says so", () => {
    const data = hostgrid();
    const links = affiliateLinks(data);
    const before = size(links);
    const seeded = first(links);

    const minted = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_LINK_CREATE, {
        redirectUrl: OFF_BRAND_REDIRECT,
        name: "Guest review"
      })
    );

    expect(minted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(size(links)).toBe(before + 1);
    expect(find(links, { redirectUrl: OFF_BRAND_REDIRECT })?.name).toBe(
      "Guest review"
    );

    const moved = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(
        MOCK_ACTION.AFFILIATE_LINK_UPDATE,
        { redirectUrl: OFF_BRAND_REDIRECT, name: seeded?.name },
        seeded?.id
      )
    );

    expect(moved?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(find(links, { id: seeded?.id })?.redirectUrl).toBe(
      OFF_BRAND_REDIRECT
    );
    expect(size(links)).toBe(before + 1);
  });
});

// -----------------------------------------------------------------------------
// E5 — what the two-factor dialog states before the code
// -----------------------------------------------------------------------------

/** The code field's own name — the real schema's, not this test's. */
function tokenKey(): string {
  const key = first(Object.keys(twoFactorDefaults()));
  if (key === undefined) throw new Error("the 2FA form opens on no field");
  return key;
}

function scopesOf(entry: { uischema?: unknown } | undefined): string[] {
  return compact(map(get(entry?.uischema, "elements") ?? [], "scope"));
}

describe("E5 — enrolling states the setup key and the address it carries", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("opens on the account's own key, and on a link that carries it", () => {
    const data = hostgrid();
    const entry = resolveMockForm(data, FORM_ID.TWOFA_ENABLE, undefined);
    const uri = String(entry?.model["uri"] ?? "");

    expect(entry?.submit).toBe(MOCK_ACTION.TWOFA_ENABLE);
    expect(entry?.model["secret"]).toBe(data.security.twoFactorSecret);
    expect(uri.startsWith("otpauth://")).toBe(true);
    expect(entry?.model[tokenKey()]).toBe(CLEARED);

    // Read as an authenticator app reads it, rather than as a string this
    // test spells: the key it enrols, the brand it names, the account it is for.
    const parsed = new URL(uri.replace("otpauth://", "https://"));
    expect(parsed.searchParams.get("secret")).toBe(
      data.security.twoFactorSecret
    );
    expect(parsed.searchParams.get("issuer")).toBe(data.brand.name);
    expect(decodeURIComponent(parsed.pathname)).toContain(data.persona.email);
  });

  it("seats both facts above the code box, and lets neither be typed into", () => {
    const entry = resolveMockForm(hostgrid(), FORM_ID.TWOFA_ENABLE, undefined);
    const scopes = scopesOf(entry);

    const rows = get(entry?.uischema, "elements") ?? [];

    // Both halves: the schema ANNOTATES the fact and the control RENDERS it,
    // and a row that only says so in the schema is still typed into.
    expect(get(entry?.schema, "properties.secret.readOnly")).toBe(true);
    expect(get(entry?.schema, "properties.uri.readOnly")).toBe(true);
    expect(
      get(find(rows, { scope: "#/properties/secret" }), "options")
    ).toEqual({ readonly: true });
    expect(get(find(rows, { scope: "#/properties/uri" }), "options")).toEqual({
      readonly: true
    });
    expect(scopes.indexOf("#/properties/secret")).toBe(0);
    expect(scopes.indexOf("#/properties/uri")).toBe(1);
    expect(scopes.indexOf(`#/properties/${tokenKey()}`)).toBeGreaterThan(1);
  });

  it("still checks the code the client types, with the facts standing", () => {
    const data = hostgrid();
    const entry = resolveMockForm(data, FORM_ID.TWOFA_ENABLE, undefined);
    if (entry === undefined) throw new Error("no enrolment form");
    const validate = usePortalAjv().compile(entry.schema);
    const stated = {
      secret: data.security.twoFactorSecret,
      uri: entry.model["uri"]
    };

    expect(validate({ ...stated, [tokenKey()]: SIX_DIGITS })).toBe(true);
    expect(validate({ ...stated, [tokenKey()]: "12345" })).toBe(false);
    expect(validate({ ...stated, [tokenKey()]: "abcdef" })).toBe(false);
    expect(validate(stated)).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// E6 — turning the second step off
// -----------------------------------------------------------------------------

describe("E6 — turning two-factor off asks for a code, as turning it on does", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks for six digits before it will take the answer", () => {
    const data = hostgrid();
    const entry = resolveMockForm(data, FORM_ID.TWOFA_DISABLE, undefined);
    if (entry === undefined) throw new Error("no disable form");
    const validate = usePortalAjv().compile(entry.schema);

    expect(entry.submit).toBe(MOCK_ACTION.TWOFA_DISABLE);
    expect(scopesOf(entry)).toContain(`#/properties/${tokenKey()}`);
    expect(validate({ [tokenKey()]: SIX_DIGITS })).toBe(true);
    expect(validate({ [tokenKey()]: "12345" })).toBe(false);
    expect(validate({ [tokenKey()]: "abcdef" })).toBe(false);
    expect(validate({})).toBe(false);
  });

  it("refuses a wrong code and leaves the second step standing", () => {
    const data = hostgrid();
    data.security.twoFactorEnabled = true;

    const receipt = useMockSecurity(data)
      .useActions()
      .disableTwoFactor({ [tokenKey()]: "12345" });

    expect(receipt.ok).toBe(false);
    expect(receipt.reason).toBe(MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE);
    expect(data.security.twoFactorEnabled).toBe(true);
  });

  it("turns it off on the right code, and only then", () => {
    const data = hostgrid();
    data.security.twoFactorEnabled = true;

    const receipt = useMockSecurity(data)
      .useActions()
      .disableTwoFactor({ [tokenKey()]: SIX_DIGITS });

    expect(receipt.ok).toBe(true);
    expect(data.security.twoFactorEnabled).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// E7 — the trail the client's own preview never carried
// -----------------------------------------------------------------------------

describe("E7 — the preview states no resend trail, though the seed keeps one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("declares no lineage row and no lineage fact at all", () => {
    const page = accountPages()[PAGE_KEY.ACCOUNT_LOGS];

    expect(filter(values(DATA_REF_ID), id => /lineage/i.test(id))).toEqual([]);
    expect(stringsIn(page).join(" ")).not.toMatch(/lineage/i);
  });
});
