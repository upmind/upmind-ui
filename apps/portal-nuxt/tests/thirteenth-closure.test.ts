// -----------------------------------------------------------------------------
/**
 * @module tests/thirteenth-closure
 * @description Phase F17: the five capabilities the thirteenth audit read as
 * open. A brand that keeps every card asks nobody whether to keep it, and
 * keeps it anyway (O-1); the billing tab's timeline carries the product's own
 * lifecycle beside the actions queued against it, each dated, read from now
 * and toned by which side of today it falls (O-2); a trial says which of four
 * things its end does, and asks the matching one of three questions before it
 * is ended early (O-3); an invoice prints the labelled facts kept about it and
 * a credit note prints none (O-4); and the credit page says what is left of
 * the allowance, tones the meter by how much that is, and names the one
 * currency it may be spent in (O-5).
 *
 * Every figure read here is the seed's own or a facade's own — nothing sums
 * money (plan R6). The bands, the tones and the four trial readings are driven
 * on CLONES rather than read off the seed, so no assertion is satisfied by a
 * fact that happened to be seeded once.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed } from "vue";
import { InvoiceStatus } from "@upmind-automation/types";
import { propsBinding, rowBinding } from "./support/page-config";
import {
  assign,
  every,
  filter,
  find,
  first,
  get,
  includes,
  isObject,
  keys,
  last,
  map,
  omit,
  size,
  some,
  uniq
} from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockCustomField,
  MockDataset,
  MockProduct,
  MockTrialEndAction
} from "~/portal/mock/types";
import type { ButtonModuleAction } from "~/portal/modules/button/types";
import type { DocumentModuleTotal } from "~/portal/modules/document/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import type { TimelineModuleItem } from "~/portal/modules/timeline/types";
import type { PageKey } from "~/portal/types";
import { billingPages } from "~/portal/config/billing-pages";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { productPages } from "~/portal/config/product-pages";
import PortalContent from "~/portal/content/PortalContent.vue";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  ACTIVE_MOCK_DATA,
  ACTIVE_ROUTE_CONTEXT
} from "~/portal/mock/injection";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_TRIAL_END_ACTION } from "~/portal/mock/types";
import { METER_MODULE_TONE } from "~/portal/modules/meter/types";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

/** The billing area of a product page — where the timeline hangs. */
const BILLING_AREA = "product-area/billing";

/** The thread past one page, and one that fits on it. */
const LONG_THREAD = "tkt-209";
const SHORT_THREAD = "tkt-208";

/** The suspended product, and the day the brand recorded against it. */
const SUSPENDED_PRODUCT = "prod-mail";
const SUSPENDED_ON = "2026-08-21";

/** The product carrying the queued actions, and the invoice it still owes. */
const SCHEDULED_PRODUCT = "prod-analytics";

/** A product with nothing standing against it at all — the rail's empty side. */
const UNSCHEDULED_PRODUCT = "prod-domains";

/** A cancelled product, and the trials that migrate, cancel and await activation. */
const CANCELLED_PRODUCT = "prod-starter";
const MIGRATING_TRIAL = "prod-seats";
const CANCELLING_TRIAL = "prod-vault";
const PENDING_TRIAL = "prod-team";

/** A product on no trial at all. */
const NO_TRIAL = "prod-analytics";

/** The one invoice seeded with all three kinds of labelled fact, and one with none. */
const DETAILED_INVOICE = "inv-95";
const PLAIN_INVOICE = "inv-94";

vi.mock("~/composables/usePortalConfig", async () => {
  const { computed } = await import("vue");
  const { hostgridConfig } = await import("~/portal/config/hostgrid");
  return {
    usePortalConfig: () => ({
      activeConfig: computed(() => hostgridConfig),
      activeConfigId: computed(() => "hostgrid"),
      activeDatasetId: computed(() => "hostgrid")
    })
  };
});

// The billing area's own rows read the route directly; a mounted page has no
// Nuxt runtime under it, so the composable has to exist before the mount.
Object.assign(globalThis, {
  useRoute: () => ({ params: {}, path: "/", query: {} })
});

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

/** A detached copy of the shipped brand — mutable where the live store is not. */
function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function refValue(
  data: MockDataset,
  id: string,
  context: DataRouteContext = NO_CONTEXT
): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value;
}

function refText(
  data: MockDataset,
  id: string,
  context: DataRouteContext = NO_CONTEXT
): string {
  const value = refValue(data, id, context);
  if (typeof value !== "string") return "";
  return value;
}

function refActions(
  data: MockDataset,
  id: string,
  context: DataRouteContext = NO_CONTEXT
): ButtonModuleAction[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

function refSpec(
  data: MockDataset,
  id: string,
  context: DataRouteContext = NO_CONTEXT
): SpecModuleItem[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

function refTotals(
  data: MockDataset,
  id: string,
  context: DataRouteContext = NO_CONTEXT
): DocumentModuleTotal[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

/** The timeline panel's own heading, read off the page config it is authored in. */
function timelinePanelTitle(): string {
  const row = rowBinding(
    productPages()[BILLING_AREA as PageKey],
    DATA_REF_ID.PRODUCT_TIMELINE_ITEMS
  );
  const header = row?.header;
  if (!isObject(header) || typeof get(header, "title") !== "string") {
    throw new Error("the timeline row carries no heading");
  }
  return String(get(header, "title"));
}

function productBy(data: MockDataset, id: string): MockProduct {
  const product = find(data.products, { id });
  if (product === undefined) throw new Error(`seed carries no ${id}`);
  return product;
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function timeline(data: MockDataset, id: string): TimelineModuleItem[] {
  const value = refValue(
    data,
    DATA_REF_ID.PRODUCT_TIMELINE_ITEMS,
    contextFor(productBy(data, id))
  );
  if (!Array.isArray(value)) return [];
  return value;
}

function eventBy(
  rows: readonly TimelineModuleItem[],
  id: string
): TimelineModuleItem | undefined {
  return find(rows, { id });
}

function mountPage(
  pageKey: PageKey,
  data: MockDataset,
  context: DataRouteContext = NO_CONTEXT
) {
  return mount(PortalContent, {
    props: {
      rows: resolve(hostgridConfig, { pageKeys: [pageKey] }).content.rows,
      asideLabel: "Page aside"
    },
    global: {
      provide: {
        [ACTIVE_MOCK_DATA as symbol]: computed(() => data),
        [ACTIVE_ROUTE_CONTEXT as symbol]: computed(() => context)
      }
    }
  });
}

/** What the thread page draws for one client, as text. */
function threadText(data: MockDataset, context: DataRouteContext): string {
  const wrapper = mountPage(PAGE_KEY.SUPPORT_TICKET_DETAIL, data, context);
  const text = wrapper.text();
  wrapper.unmount();
  return text;
}

/** The whole trial banner one product reads, and the control beside it. */
function trialReading(data: MockDataset, id: string) {
  const context = contextFor(productBy(data, id));
  return {
    shows: refValue(data, DATA_REF_ID.PRODUCT_HAS_TRIAL_MESSAGE, context),
    message: refText(data, DATA_REF_ID.PRODUCT_TRIAL_MESSAGE, context),
    control: refValue(data, DATA_REF_ID.PRODUCT_TRIAL_ACTION, context)
  };
}

/** The same product read four ways — one per thing the end of a trial does. */
function underTrialAction(action: MockTrialEndAction) {
  const data = clone();
  assign(productBy(data, MIGRATING_TRIAL), { trialEndAction: action });
  return {
    data,
    ...trialReading(data, MIGRATING_TRIAL),
    confirm: dispatchMockAction(
      data,
      contextFor(productBy(data, MIGRATING_TRIAL)),
      `${MOCK_ACTION.END_TRIAL}:${MIGRATING_TRIAL}`
    )?.confirm
  };
}

/** The credit page as it reads with a given slice of the allowance spent. */
function creditAt(used: number) {
  const data = clone();
  const limit = data.wallet.creditLimit;
  if (limit === undefined) throw new Error("the seed grants no allowance");
  assign(data.wallet, {
    creditLimit: assign({}, limit, {
      used: assign({}, limit.used, { amount: used, formatted: `£${used}.00` })
    })
  });
  return {
    data,
    tone: refValue(data, DATA_REF_ID.WALLET_CREDIT_TONE),
    summary: refText(data, DATA_REF_ID.WALLET_CREDIT_SUMMARY),
    spec: refSpec(data, DATA_REF_ID.WALLET_CREDIT_LIMIT_SPEC_ITEMS)
  };
}

function specValue(items: readonly SpecModuleItem[], id: string): string {
  const item = find(items, { id });
  if (item === undefined) throw new Error(`the panel states no ${id}`);
  return String(item.value);
}

/** Every labelled fact one invoice keeps, in the three kinds it keeps them under. */
function invoiceFacts(data: MockDataset, invoiceId: string): MockCustomField[] {
  const invoice = find(data.invoices, { id: invoiceId });
  if (invoice === undefined) throw new Error(`seed carries no ${invoiceId}`);
  return [
    ...(invoice.clientFields ?? []),
    ...(invoice.customFields ?? []),
    ...(invoice.metaData ?? [])
  ];
}

// -----------------------------------------------------------------------------
// F16 repair — the control that resolved but never drew
// -----------------------------------------------------------------------------

describe("the thread's Show-earlier control reaches the page it lives on", () => {
  beforeEach(bothSeeds);

  it("the mounted thread page carries a Show-earlier control on a long thread", () => {
    const data = hostgrid();
    const offer = first(
      refActions(data, DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS, {
        entityId: LONG_THREAD
      })
    );

    // The control is DATA before it is pixels, and its own label is what the
    // page has to end up drawing — no wording is written here.
    expect(offer?.label).toMatch(/\S/);
    expect(offer?.value).toContain("page=2");

    const opening = threadText(data, { entityId: LONG_THREAD });
    expect(opening).toContain(offer?.label);

    // Asked for, there is nothing left behind the fold, so nothing is drawn.
    expect(
      refActions(data, DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS, {
        entityId: LONG_THREAD,
        page: "2"
      })
    ).toEqual([]);
    expect(
      threadText(data, { entityId: LONG_THREAD, page: "2" })
    ).not.toContain(offer?.label);

    // A thread that fits on one page never offers it at all.
    expect(
      refActions(data, DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS, {
        entityId: SHORT_THREAD
      })
    ).toEqual([]);
    expect(threadText(data, { entityId: SHORT_THREAD })).not.toContain(
      offer?.label
    );
  });
});

// -----------------------------------------------------------------------------
// O-1 — the brand that keeps every card
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// O-2 — the product's own lifecycle, beside what is queued against it
// -----------------------------------------------------------------------------

describe("O-2 — the billing timeline reads the product's own dates", () => {
  beforeEach(bothSeeds);

  it("the billing timeline carries the product's own lifecycle events beside the scheduled actions", () => {
    const data = clone();
    const queued = productBy(data, SCHEDULED_PRODUCT);
    const rows = timeline(data, SCHEDULED_PRODUCT);
    const queuedIds = map(queued.scheduledActions, "id");

    // Every queued action is still a row of its own, on its own day.
    expect(size(queuedIds)).toBeGreaterThan(1);
    for (const action of queued.scheduledActions) {
      expect({
        id: action.id,
        datetime: eventBy(rows, action.id)?.datetime,
        title: eventBy(rows, action.id)?.title
      }).toEqual({
        id: action.id,
        datetime: action.scheduledAt,
        title: action.label
      });
    }

    // And the product's own lifecycle stands beside them, merged by date.
    const lifecycle = filter(rows, row => !includes(queuedIds, row.id));
    expect(size(lifecycle)).toBeGreaterThan(0);
    expect(map(rows, "datetime")).toEqual([...map(rows, "datetime")].sort());

    // A product it renews itself reads its renewal; the same product told to
    // renew nothing reads the invoice nobody will raise for it instead.
    const renewing = clone();
    assign(productBy(renewing, SCHEDULED_PRODUCT), { autoRenew: true });
    const renewal = eventBy(timeline(renewing, SCHEDULED_PRODUCT), "renewal");
    expect(renewal?.datetime).toBe(queued.nextDueDate);
    expect(
      eventBy(timeline(renewing, SCHEDULED_PRODUCT), "next-invoice")
    ).toBeUndefined();

    const manual = clone();
    assign(productBy(manual, SCHEDULED_PRODUCT), { autoRenew: false });
    const raise = eventBy(timeline(manual, SCHEDULED_PRODUCT), "next-invoice");
    expect(raise?.datetime).toBe(queued.nextDueDate);
    expect(raise?.description).toMatch(/\S/);
    expect(raise?.description).not.toBe(renewal?.description);
    expect(
      eventBy(timeline(manual, SCHEDULED_PRODUCT), "auto-renew-off")?.datetime
    ).toBe(queued.nextDueDate);

    // What is owed is named by the document that owes it, and reads
    // differently once the day has passed.
    const owed = find(data.invoices, {
      productId: SCHEDULED_PRODUCT,
      status: InvoiceStatus.UNPAID
    });
    if (owed === undefined) throw new Error("no owed invoice on that product");
    const overdue = eventBy(rows, "payment");
    expect(overdue?.datetime).toBe(owed.dueDate);
    expect(overdue?.description).toContain(owed.number);
    expect(overdue?.description).toContain(owed.unpaidAmount.formatted);

    const later = clone();
    assign(find(later.invoices, { id: owed.id }), { dueDate: "2026-12-01" });
    assign(productBy(later, SCHEDULED_PRODUCT), { nextDueDate: "2026-12-01" });
    const due = eventBy(timeline(later, SCHEDULED_PRODUCT), "payment");
    expect(due?.datetime).toBe("2026-12-01");
    expect(due?.title).not.toBe(overdue?.title);
    expect(due?.description).toContain(owed.number);

    // Cancellation, termination and suspension each read their own day.
    const cancelled = productBy(data, CANCELLED_PRODUCT);
    expect(
      eventBy(timeline(data, CANCELLED_PRODUCT), "cancelled")?.datetime
    ).toBe(cancelled.cancelledAt);
    const expiring = productBy(data, MIGRATING_TRIAL);
    expect(
      eventBy(timeline(data, MIGRATING_TRIAL), "terminated")?.datetime
    ).toBe(expiring.autoExpireAt);
    expect(
      eventBy(timeline(data, SUSPENDED_PRODUCT), "suspended")?.datetime
    ).toBe(SUSPENDED_ON);

    // Both seeds: the one product the gates-off brand carries reads too.
    const only = first(minimal().products);
    if (only === undefined) throw new Error("the minimal seed has no product");
    expect(
      size(
        refValue(
          minimal(),
          DATA_REF_ID.PRODUCT_TIMELINE_ITEMS,
          contextFor(only)
        )
      )
    ).toBeGreaterThan(0);
  });

  it("the mounted billing page draws the lifecycle events it derives", () => {
    const data = clone();
    const suspended = productBy(data, SUSPENDED_PRODUCT);
    const rows = timeline(data, SUSPENDED_PRODUCT);
    const wrapper = mountPage(
      BILLING_AREA as PageKey,
      data,
      contextFor(suspended)
    );
    const text = wrapper.text();
    wrapper.unmount();

    // The rail is derived for a product with no queued action against it
    // (F17 ruling: a page-level panel is proved by a mounted page).
    expect(size(suspended.scheduledActions)).toBe(0);
    expect(size(rows)).toBeGreaterThan(0);
    expect(
      refValue(data, DATA_REF_ID.PRODUCT_HAS_TIMELINE, contextFor(suspended))
    ).toBe(true);
    for (const row of rows) {
      expect({ id: row.id, drawn: includes(text, row.description) }).toEqual({
        id: row.id,
        drawn: true
      });
    }

    // The other side of the gate: a product that derives nothing draws no
    // rail at all, so the panel follows the rows rather than standing open.
    const bare = productBy(data, UNSCHEDULED_PRODUCT);
    expect(timeline(data, UNSCHEDULED_PRODUCT)).toEqual([]);
    expect(
      refValue(data, DATA_REF_ID.PRODUCT_HAS_TIMELINE, contextFor(bare))
    ).toBe(false);
    const empty = mountPage(BILLING_AREA as PageKey, data, contextFor(bare));
    const emptyText = empty.text();
    empty.unmount();
    expect(emptyText).not.toContain(timelinePanelTitle());
    expect(text).toContain(timelinePanelTitle());
  });

  it("the payment event links the invoice it names", () => {
    const data = clone();
    const owed = find(data.invoices, {
      productId: SCHEDULED_PRODUCT,
      status: InvoiceStatus.UNPAID
    });
    if (owed === undefined) throw new Error("no owed invoice on that product");

    const payment = eventBy(timeline(data, SCHEDULED_PRODUCT), "payment");
    expect(payment?.description).toContain(owed.number);
    expect(payment?.to).toBe(`/billing/invoices/${owed.id}`);

    // The link follows the DOCUMENT, not the product: the same product owing
    // a different invoice leads to that one instead.
    const other = clone();
    const swapped = find(other.invoices, { id: owed.id });
    assign(swapped, { id: "inv-swapped", number: "INV-SWAPPED" });
    const moved = eventBy(timeline(other, SCHEDULED_PRODUCT), "payment");
    expect(moved?.to).toBe("/billing/invoices/inv-swapped");
    expect(moved?.to).not.toBe(payment?.to);

    // The invoice nobody has raised has no document to lead to, so that row
    // leads to where the client can raise it instead.
    const manual = clone();
    assign(productBy(manual, SUSPENDED_PRODUCT), { autoRenew: false });
    const raise = eventBy(timeline(manual, SUSPENDED_PRODUCT), "next-invoice");
    expect(raise?.to).toBe(`/products/${SUSPENDED_PRODUCT}/billing`);
    expect(raise?.to).not.toContain("/billing/invoices/");

    // Dates alone lead nowhere — a link is only where something is reachable.
    expect(
      eventBy(timeline(data, SUSPENDED_PRODUCT), "suspended")?.to
    ).toBeUndefined();
    expect(
      eventBy(timeline(data, CANCELLED_PRODUCT), "cancelled")?.to
    ).toBeUndefined();
  });

  it("a datetime reads as its day, never as the raw stamp", () => {
    const stamped = clone();
    assign(productBy(stamped, SUSPENDED_PRODUCT), {
      suspendedAt: `${SUSPENDED_ON}T23:30:00Z`
    });
    const row = eventBy(timeline(stamped, SUSPENDED_PRODUCT), "suspended");

    // The reading states the day and nothing after it; the machine-readable
    // stamp is the seed's own, untouched.
    expect(row?.description).toContain(SUSPENDED_ON);
    expect(row?.description).not.toContain("23:30");
    expect(row?.description).not.toContain(`${SUSPENDED_ON}T`);
    expect(row?.description).not.toContain("2026-08-22");
    expect(row?.datetime).toBe(`${SUSPENDED_ON}T23:30:00Z`);

    // A stamp late enough to cross midnight in one direction and early enough
    // to cross it in the other still reads the day it carries.
    for (const [stamp, day] of [
      ["2026-07-02T00:15:00Z", "2026-07-02"],
      ["2026-07-02T23:45:00Z", "2026-07-02"]
    ] as const) {
      const edge = clone();
      assign(productBy(edge, SUSPENDED_PRODUCT), { suspendedAt: stamp });
      const reading =
        eventBy(timeline(edge, SUSPENDED_PRODUCT), "suspended")?.description ??
        "";
      expect({ stamp, names: includes(reading, day) }).toEqual({
        stamp,
        names: true
      });
      expect({ stamp, raw: includes(reading, stamp) }).toEqual({
        stamp,
        raw: false
      });
    }
  });

  it("an undated fact carries no date and falls to the end of the rail", () => {
    const data = clone();
    const dated = eventBy(timeline(data, SUSPENDED_PRODUCT), "suspended");
    const undated = clone();
    const index = undated.products.findIndex(
      candidate => candidate.id === SUSPENDED_PRODUCT
    );
    undated.products[index] = omit(undated.products[index], ["suspendedAt"]);

    const rows = timeline(undated, SUSPENDED_PRODUCT);
    const row = eventBy(rows, "suspended");

    // The fact still reads, and reads differently from the dated one.
    expect(dated?.datetime).toBe(SUSPENDED_ON);
    expect(row?.description).toMatch(/\S/);
    expect(row?.description).not.toBe(dated?.description);
    expect(row?.datetime).toBeUndefined();

    // With no day to sort on it goes last, and everything dated keeps its
    // own order in front of it.
    expect(size(rows)).toBeGreaterThan(1);
    expect(last(rows)?.id).toBe("suspended");
    const dates = map(rows.slice(0, -1), "datetime");
    expect(every(dates, date => date !== undefined)).toBe(true);
    expect(dates).toEqual([...dates].sort());
  });

  it("a past lifecycle event reads apart from a future one", () => {
    const past = clone();
    assign(productBy(past, CANCELLED_PRODUCT), { cancelledAt: "2026-01-09" });
    const ahead = clone();
    assign(productBy(ahead, CANCELLED_PRODUCT), { cancelledAt: "2026-12-24" });

    const behind = eventBy(timeline(past, CANCELLED_PRODUCT), "cancelled");
    const coming = eventBy(timeline(ahead, CANCELLED_PRODUCT), "cancelled");

    // The same fact on either side of today: a different tone and a different
    // reading, off nothing but the date.
    expect(behind?.tone).toBe("warning");
    expect(coming?.tone).toBe("info");
    expect(behind?.description).toMatch(/\S/);
    expect(coming?.description).toMatch(/\S/);
    expect(behind?.description).not.toBe(coming?.description);

    // The rule is the timeline's, not one row's: a renewal reads the same way.
    const overdue = clone();
    assign(productBy(overdue, SCHEDULED_PRODUCT), {
      autoRenew: true,
      nextDueDate: "2026-02-14"
    });
    const soon = clone();
    assign(productBy(soon, SCHEDULED_PRODUCT), {
      autoRenew: true,
      nextDueDate: "2026-12-14"
    });
    expect(eventBy(timeline(overdue, SCHEDULED_PRODUCT), "renewal")?.tone).toBe(
      "warning"
    );
    expect(eventBy(timeline(soon, SCHEDULED_PRODUCT), "renewal")?.tone).toBe(
      "info"
    );
  });

  it("the suspension row states the suspension day, not the purchase day", () => {
    const data = clone();
    const product = productBy(data, SUSPENDED_PRODUCT);
    const row = eventBy(timeline(data, SUSPENDED_PRODUCT), "suspended");

    // The two days are different facts, and the seed keeps them apart.
    expect(product.suspendedAt).toBe(SUSPENDED_ON);
    expect(product.purchasedAt).not.toBe(product.suspendedAt);
    expect(row?.datetime).toBe(product.suspendedAt);
    expect(row?.description).not.toContain(product.purchasedAt);

    // Move the suspension and the row moves with it; the purchase never moved.
    const moved = clone();
    assign(productBy(moved, SUSPENDED_PRODUCT), { suspendedAt: "2026-07-02" });
    const after = eventBy(timeline(moved, SUSPENDED_PRODUCT), "suspended");
    expect(after?.datetime).toBe("2026-07-02");
    expect(after?.description).not.toBe(row?.description);
    expect(productBy(moved, SUSPENDED_PRODUCT).purchasedAt).toBe(
      product.purchasedAt
    );

    // With no day recorded the row says it is suspended and names no day at
    // all — never the day it was bought.
    const undated = clone();
    const index = undated.products.findIndex(
      candidate => candidate.id === SUSPENDED_PRODUCT
    );
    undated.products[index] = omit(undated.products[index], ["suspendedAt"]);
    const bare = eventBy(timeline(undated, SUSPENDED_PRODUCT), "suspended");
    expect(bare?.description).toMatch(/\S/);
    expect(bare?.description).not.toContain(product.purchasedAt);
    expect(bare?.description).not.toBe(row?.description);
  });
});

// -----------------------------------------------------------------------------
// O-3 — what the end of a trial does
// -----------------------------------------------------------------------------

describe("O-3 — a trial says what its ending does", () => {
  beforeEach(bothSeeds);

  it("the trial banner reads the sentence its own trial-end action names", () => {
    const readings = map(MOCK_TRIAL_END_ACTION, action =>
      underTrialAction(action)
    );

    // One sentence per thing the ending does, and no two alike.
    expect(size(readings)).toBe(4);
    expect(size(uniq(map(readings, "message")))).toBe(4);
    expect(every(readings, reading => reading.shows === true)).toBe(true);

    // Each names how long is left, what it is about, and the control that
    // ends it early re-dispatches this product's own verb.
    const trial = productBy(clone(), MIGRATING_TRIAL);
    for (const reading of readings) {
      expect(reading.message).toMatch(/\bdays\b/);
      expect(reading.message).toContain("product");
      expect(reading.control).toEqual({
        value: `${MOCK_ACTION.END_TRIAL}:${MIGRATING_TRIAL}`,
        label: expect.stringMatching(/\S/)
      });
    }

    // A running trial names the day it runs out; the one that has not begun
    // says so instead of naming a day it cannot know.
    const running = filter(
      readings,
      reading => !includes(reading.message, "activated")
    );
    expect(size(running)).toBe(3);
    expect(
      every(running, reading => includes(reading.message, trial.trialEndsAt))
    ).toBe(true);

    // The seeds carry three of the four between them, each reading its own.
    const seeded = [MIGRATING_TRIAL, CANCELLING_TRIAL].map(id =>
      trialReading(hostgrid(), id)
    );
    const only = first(minimal().products);
    if (only === undefined) throw new Error("the minimal seed has no product");
    seeded.push(trialReading(minimal(), only.id));
    expect(size(uniq(map(seeded, "message")))).toBe(3);
    expect(
      map(
        [MIGRATING_TRIAL, CANCELLING_TRIAL],
        id => productBy(hostgrid(), id).trialEndAction
      )
    ).toEqual([MOCK_TRIAL_END_ACTION.MIGRATE, MOCK_TRIAL_END_ACTION.CANCEL]);
    expect(only.trialEndAction).toBe(MOCK_TRIAL_END_ACTION.CONTINUE);

    // A trial that has not started names no day either, off its own standing.
    expect(trialReading(hostgrid(), PENDING_TRIAL).message).not.toContain(
      productBy(hostgrid(), PENDING_TRIAL).trialEndsAt
    );

    // Off a trial there is no row at all.
    const settled = trialReading(hostgrid(), NO_TRIAL);
    expect(productBy(hostgrid(), NO_TRIAL).trialEndsAt).toBeUndefined();
    expect(settled.shows).toBe(false);
    expect(settled.message).toBe("");
  });

  it("the end-trial confirmation reads the message its own trial-end action names", () => {
    const asked = map(MOCK_TRIAL_END_ACTION, action =>
      underTrialAction(action)
    );
    const messages = map(asked, reading => reading.confirm?.description ?? "");

    // Legacy asked three questions, so three is what the four actions reach.
    expect(size(uniq(messages))).toBe(3);
    expect(every(messages, message => message !== "")).toBe(true);

    // Cancelling a trial is the one that ends the product, and reads apart
    // from both of the ones that keep it.
    const by = (action: MockTrialEndAction) =>
      underTrialAction(action).confirm?.description ?? "";
    expect(by(MOCK_TRIAL_END_ACTION.CANCEL)).not.toBe(
      by(MOCK_TRIAL_END_ACTION.MIGRATE)
    );
    expect(by(MOCK_TRIAL_END_ACTION.CANCEL)).not.toBe(
      by(MOCK_TRIAL_END_ACTION.CONTINUE)
    );
    expect(by(MOCK_TRIAL_END_ACTION.MIGRATE)).not.toBe(
      by(MOCK_TRIAL_END_ACTION.CONTINUE)
    );

    // The question is asked before anything moves, and its answer is the
    // destructive half of the same verb.
    for (const reading of asked) {
      expect(reading.confirm?.destructive).toBe(true);
      expect(reading.confirm?.then).toBe(
        `${MOCK_ACTION.END_TRIAL_CONFIRMED}:${MIGRATING_TRIAL}`
      );
      expect(productBy(reading.data, MIGRATING_TRIAL).trialEndsAt).toBe(
        productBy(clone(), MIGRATING_TRIAL).trialEndsAt
      );
    }

    // A product on no trial is refused rather than asked.
    const data = hostgrid();
    const refused = dispatchMockAction(
      data,
      contextFor(productBy(data, NO_TRIAL)),
      `${MOCK_ACTION.END_TRIAL}:${NO_TRIAL}`
    );
    expect(refused?.confirm).toBeUndefined();
    expect(refused?.toast?.title).toBe(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_IN_TRIAL]
    );
  });
});

// -----------------------------------------------------------------------------
// O-4 — the labelled facts printed under a document
// -----------------------------------------------------------------------------

describe("O-4 — an invoice prints what is kept about it", () => {
  beforeEach(bothSeeds);

  it("the invoice document lists its client fields, custom fields and meta-data", () => {
    const data = hostgrid();
    const kept = invoiceFacts(data, DETAILED_INVOICE);
    const invoice = find(data.invoices, { id: DETAILED_INVOICE });

    // All three kinds are seeded, and all three reach the well, each under
    // its own term and beside its own value.
    expect(size(invoice?.clientFields ?? [])).toBeGreaterThan(0);
    expect(size(invoice?.customFields ?? [])).toBeGreaterThan(0);
    expect(size(invoice?.metaData ?? [])).toBeGreaterThan(0);

    const well = refTotals(data, DATA_REF_ID.INVOICE_DOCUMENT_DETAILS, {
      entityId: DETAILED_INVOICE
    });
    expect(map(well, "label")).toEqual(map(kept, "label"));
    expect(map(well, "value")).toEqual(map(kept, "value"));

    // A document with none of the three prints no well at all.
    expect(size(invoiceFacts(data, PLAIN_INVOICE))).toBe(0);
    expect(
      refTotals(data, DATA_REF_ID.INVOICE_DOCUMENT_DETAILS, {
        entityId: PLAIN_INVOICE
      })
    ).toEqual([]);

    // The invoice page hands the well to its document; the credit note's own
    // document is handed none, which is legacy's `!isCreditNote` gate.
    const pages = billingPages();
    const invoiceProps = propsBinding(
      pages[PAGE_KEY.BILLING_INVOICE_DETAIL],
      DATA_REF_ID.INVOICE_DOCUMENT_HEADER
    );
    const creditNoteProps = propsBinding(
      pages[PAGE_KEY.BILLING_CREDIT_NOTE_DETAIL],
      DATA_REF_ID.CREDIT_NOTE_DOCUMENT_HEADER
    );
    expect(invoiceProps?.details).toEqual(
      dataRef(DATA_REF_ID.INVOICE_DOCUMENT_DETAILS)
    );
    expect(creditNoteProps?.header).toBeDefined();
    expect(creditNoteProps?.details).toBeUndefined();
    expect(
      some(keys(DATA_REF_ID), id =>
        includes(id, "CREDIT_NOTE_DOCUMENT_DETAILS")
      )
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// O-5 — the credit limit's standing sentence and its meter
// -----------------------------------------------------------------------------

describe("O-5 — the credit page reads how far this account may run", () => {
  beforeEach(bothSeeds);

  it("the credit page names what is left of the allowance and the allowance itself", () => {
    const data = hostgrid();
    const spec = refSpec(data, DATA_REF_ID.WALLET_CREDIT_LIMIT_SPEC_ITEMS);
    const summary = refText(data, DATA_REF_ID.WALLET_CREDIT_SUMMARY);
    const copy = refText(data, DATA_REF_ID.WALLET_CREDIT_PANEL_COPY);
    const limit = data.wallet.creditLimit;

    // Every figure is the panel's own — nothing is summed here (plan R6).
    expect(refValue(data, DATA_REF_ID.WALLET_HAS_CREDIT_LIMIT)).toBe(true);
    expect(summary).toContain(specValue(spec, "remaining"));
    expect(summary).toContain(specValue(spec, "allowance"));
    expect(specValue(spec, "allowance")).toBe(limit?.allowance.formatted);
    expect(specValue(spec, "used")).toBe(limit?.used.formatted);

    // What is LEFT is what the sentence leads with, and it is not the spend.
    expect(specValue(spec, "remaining")).not.toBe(specValue(spec, "used"));

    // The panel's own copy names the allowance and the one currency it may be
    // spent in — the meter's scale is that same allowance.
    expect(copy).toContain(limit?.allowance.formatted);
    expect(copy).toContain(limit?.allowance.currency);
    expect(refValue(data, DATA_REF_ID.WALLET_CREDIT_ALLOWANCE)).toBe(
      limit?.allowance.amount
    );
    expect(refValue(data, DATA_REF_ID.WALLET_CREDIT_USED)).toBe(
      limit?.used.amount
    );

    // Spend more of it and the sentence follows the figures rather than the
    // seed — the allowance holds, what is left moves.
    const spent = creditAt(400);
    expect(spent.summary).toContain(specValue(spent.spec, "remaining"));
    expect(spent.summary).toContain(specValue(spent.spec, "allowance"));
    expect(spent.summary).not.toBe(summary);
    expect(specValue(spent.spec, "allowance")).toBe(
      specValue(spec, "allowance")
    );

    // A brand that grants none renders none of it.
    expect(minimal().wallet.creditLimit).toBeUndefined();
    expect(refValue(minimal(), DATA_REF_ID.WALLET_HAS_CREDIT_LIMIT)).toBe(
      false
    );
  });

  it("the credit meter tones by how much of the allowance is left", () => {
    // Four clones of one account, each with a different slice of the same
    // £500 allowance spent: 20%, 40%, 60% and 90% of it left.
    const bands = map([400, 300, 200, 50], creditAt);
    const tones = map(bands, "tone");

    expect(tones).toEqual([
      METER_MODULE_TONE.DANGER,
      METER_MODULE_TONE.WARNING,
      METER_MODULE_TONE.CAUTION,
      METER_MODULE_TONE.SUCCESS
    ]);
    expect(size(uniq(tones))).toBe(4);

    // Each band ends on a pound: one more spent drops the meter a band, and
    // the pound before it does not.
    const edges = [
      [127, METER_MODULE_TONE.SUCCESS, 128, METER_MODULE_TONE.CAUTION],
      [252, METER_MODULE_TONE.CAUTION, 253, METER_MODULE_TONE.WARNING],
      [377, METER_MODULE_TONE.WARNING, 378, METER_MODULE_TONE.DANGER]
    ] as const;
    for (const [held, above, spent, below] of edges) {
      expect({ used: held, tone: creditAt(held).tone }).toEqual({
        used: held,
        tone: above
      });
      expect({ used: spent, tone: creditAt(spent).tone }).toEqual({
        used: spent,
        tone: below
      });
    }

    // The library publishes no fifth accent, so caution rides primary — and
    // it is still its own band, not a repeat of one beside it.
    expect(METER_MODULE_TONE.CAUTION).toBe("primary");
    expect(METER_MODULE_TONE.CAUTION).not.toBe(METER_MODULE_TONE.SUCCESS);
  });
});
