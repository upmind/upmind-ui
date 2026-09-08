// -----------------------------------------------------------------------------
/**
 * @module tests/fourteenth-closure
 * @description Phase F18: the six capabilities the fourteenth audit read as
 * open. A page's own route carries every member its context declares, so a
 * long thread pages from the URL the client is on (O-0); a delegate
 * invitation link lands somewhere that reads it (O-1); every product draws
 * the banner its own standing calls for, running ones included (O-2); a
 * thread reads the sentence its status names (O-3); a product is invoiced as
 * one of the account's companies (O-4); the unpaid notice reads louder for a
 * debt in hand than for one in prospect (O-5); and the revealed PIN is copied
 * before it goes back behind its mask (O-6).
 *
 * The route-borne readings are driven THROUGH the pages themselves — mounted
 * against a route and a query, never against a context assembled here — and
 * the standings the seeds do not carry are driven on clones, so no assertion
 * rests on a fact that happened to be seeded once.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceStatusGroups,
  TicketStatusCodes
} from "@upmind-automation/types";
import { clearPageGlobals, hostedAt } from "./support/logged-out-host";
import {
  assign,
  every,
  filter,
  find,
  first,
  includes,
  keys,
  map,
  pick,
  reject,
  size,
  some,
  uniq,
  values
} from "lodash-es";
import type { Component } from "vue";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockCompany,
  MockDataset,
  MockProduct,
  MockTicket
} from "~/portal/mock/types";
import type { ButtonModuleAction } from "~/portal/modules/button/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { isSupportPinRevealed } from "~/portal/mock/facades";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { ROUTE_QUERY_KEY } from "~/portal/mock/injection";
import {
  delegateInviteAction,
  delegateInviteMessage,
  delegateInviteTitle,
  delegateInviteTone,
  productCompanyItems,
  productConditionAction,
  productConditionMessage,
  productConditionTitle,
  productConditionTone,
  productHasCondition,
  productHasUnpaidInvoices,
  productUnpaidInvoiceTone,
  supportPinActions,
  supportPinPanelItems,
  ticketStatusMessage,
  ticketStatusTitle,
  ticketThreadMoreActions
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

/** The thread past one page — 24 messages against a 20-row fold. */
const LONG_THREAD = "tkt-209";

/** The link the seed left live, the one already spent, and one nothing issued. */
const LIVE_INVITE = "inv-9f3a2c";
const SPENT_INVITE = "inv-1b7e40";
const UNKNOWN_INVITE = "inv-not-a-hash-4c81";

/** An id no seed mints. */
const ABSENT_ID = "no-such-row-9f3c";

/** A product renewing on schedule with nothing else standing against it. */
const RENEWING_PRODUCT = "prod-active-13";

/** A one-time purchase already fulfilled, and a contract already cancelled. */
const FULFILLED_PRODUCT = "prod-workshop";
const CANCELLED_PRODUCT = "prod-starter";

/** The product carrying the seed's unpaid invoice, and the suspended one. */
const OWING_PRODUCT = "prod-analytics";

/** A product the brand has not activated yet, and whose setup it asks about. */
const AWAITING_PRODUCT = "prod-team";

/** Dates no seed carries — a clone's own, so a sentence proves it read them. */
const LAPSED_ON = "2024-04-04";
const TRIAL_ENDS = "2026-12-24";
const WENT_LIVE = "2025-05-05";
const ASKED_ON = "2026-08-28";
const STOPS_ON = "2026-11-30";
const CANCEL_REASON = "Moving elsewhere";

/** The two days one thread is read against — the call it booked, and its last change. */
const BOOKED_DAY = "2026-10-09";
const UPDATED_DAY = "2026-08-23";

const FUTURE_DUE = "2099-01-01";
const PAST_DUE = "2000-01-01";

type PageModule = { readonly default: Component };

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

function productBy(data: MockDataset, id: string): MockProduct {
  const product = find(data.products, { id });
  if (product === undefined) throw new Error(`seed carries no ${id}`);
  return product;
}

function ticketBy(data: MockDataset, id: string): MockTicket {
  const ticket = find(data.tickets, { id });
  if (ticket === undefined) throw new Error(`seed carries no ${id}`);
  return ticket;
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

/** The whole banner one product draws. */
function condition(data: MockDataset, product: MockProduct) {
  const context = contextFor(product);
  return {
    has: productHasCondition(data, context),
    title: productConditionTitle(data, context),
    message: productConditionMessage(data, context),
    tone: productConditionTone(data, context),
    action: productConditionAction(data, context)
  };
}

function stubRoute(route: Record<string, unknown>): void {
  Object.assign(globalThis, {
    useRoute: () => route,
    definePageMeta: () => undefined,
    navigateTo: vi.fn()
  });
}

/** One page file, mounted against a real route — what a client would see. */
async function openPage(
  load: () => Promise<PageModule>,
  route: Record<string, unknown>
): Promise<string> {
  stubRoute(route);
  const page = await load();
  const host = defineComponent({
    render: () => h(Suspense, null, { default: () => h(page.default) })
  });
  const wrapper = mount(host);
  await flushPromises();
  const text = wrapper.text();
  wrapper.unmount();
  return text;
}

/** The context one page file hands its host, off that page's own route. */
async function hostContextAt(
  load: () => Promise<PageModule>,
  route: Record<string, unknown>
): Promise<DataRouteContext> {
  const seen: DataRouteContext[] = [];
  const recorder = defineComponent({
    name: "PortalPageHost",
    props: { routeContext: { type: Object, default: undefined } },
    setup(props) {
      if (props.routeContext !== undefined) seen.push(props.routeContext);
      return () => undefined;
    }
  });
  stubRoute(route);
  const page = await load();
  mount(page.default, { global: { stubs: { PortalPageHost: recorder } } });
  await flushPromises();
  const context = first(seen);
  if (context === undefined) throw new Error("the page seated no host");
  return context;
}

function threadPageText(query: Record<string, string>): Promise<string> {
  return openPage(() => import("~/pages/support/tickets/[id].vue"), {
    params: { id: LONG_THREAD },
    path: `/support/tickets/${LONG_THREAD}`,
    query
  });
}

function invitePageText(hash: string): Promise<string> {
  return openPage(() => import("~/pages/delegate-access/accept/[hash].vue"), {
    params: { hash },
    path: `/delegate-access/accept/${hash}`,
    query: {}
  });
}

function inviteContext(hash?: string): Promise<DataRouteContext> {
  const params = hash === undefined ? {} : { hash };
  return hostContextAt(
    () => import("~/pages/delegate-access/accept/[hash].vue"),
    {
      params,
      path: `/delegate-access/accept/${hash ?? ""}`,
      query: {}
    }
  );
}

/** The whole banner the invitation page draws for one link. */
function inviteReading(data: MockDataset, context: DataRouteContext) {
  return {
    title: delegateInviteTitle(data, context),
    message: delegateInviteMessage(data, context),
    tone: delegateInviteTone(data, context),
    action: delegateInviteAction(data, context)
  };
}

function requiredAction(
  action: ButtonModuleAction | undefined
): ButtonModuleAction {
  if (action === undefined) throw new Error("the banner offers no control");
  return action;
}

function threadBodies(data: MockDataset): string[] {
  return map(ticketBy(data, LONG_THREAD).messages, "body");
}

function drawn(text: string, bodies: readonly string[]): number {
  return size(filter(bodies, body => includes(text, body)));
}

function moreControl(data: MockDataset): ButtonModuleAction {
  const control = first(
    ticketThreadMoreActions(data, { entityId: LONG_THREAD })
  );
  if (control === undefined) throw new Error("the thread offers no fold");
  return control;
}

/** The same thread read at one status, dated apart so the sentence proves which day it took. */
function standingAt(status: TicketStatusCodes, ticketId: string) {
  const data = clone();
  const ticket = ticketBy(data, ticketId);
  assign(ticket, {
    status,
    updatedAt: `${UPDATED_DAY}T10:30:00Z`,
    scheduledAt: `${BOOKED_DAY}T09:00:00Z`,
    closedAt: "2026-08-30"
  });
  return {
    title: ticketStatusTitle(data, { entityId: ticket.id }),
    message: ticketStatusMessage(data, { entityId: ticket.id })
  };
}

/** The same product read once per kind of cancellation the wire declares. */
function cancelling(status: CancellationRequestStatusCodes, cancelAt?: string) {
  const data = clone();
  const product = productBy(data, RENEWING_PRODUCT);
  const asked = { status, requestedAt: ASKED_ON, reason: CANCEL_REASON };
  assign(product, {
    cancellationRequest:
      cancelAt === undefined ? asked : assign({}, asked, { cancelAt })
  });
  return condition(data, product);
}

function cancellingAt(status: CancellationRequestStatusCodes) {
  return cancelling(status, STOPS_ON);
}

/** The wire leaves `cancelAt` optional — a request booked before a day is set. */
function cancellingWithNoDay(status: CancellationRequestStatusCodes) {
  return cancelling(status);
}

/** The awaiting-activation product, with the brand's questions or without them. */
function awaitingActivation(asking: boolean) {
  const data = clone();
  const product = productBy(data, AWAITING_PRODUCT);
  if (!asking) {
    assign(product, {
      provisioning: assign({}, product.provisioning, { fields: [] })
    });
  }
  return {
    fields: product.provisioning.fields.length,
    status: product.status,
    ...condition(data, product)
  };
}

function companyRow(rows: readonly ListModuleItem[], id: string) {
  const row = find(rows, { id });
  if (row === undefined) throw new Error(`the panel offers no ${id}`);
  return row;
}

/** The one product the minimal brand ships. */
function soleProduct(data: MockDataset): MockProduct {
  const product = first(data.products);
  if (product === undefined) throw new Error("seed carries no product");
  return product;
}

function seededCompany(data: MockDataset): MockCompany {
  const company = first(data.companies);
  if (company === undefined) throw new Error("seed carries no company");
  return company;
}

/** The clone's unpaid invoices, moved to one side of today or the other. */
function owingClone(dueDate: string, status?: ContractStatusCodes) {
  const data = clone();
  const product = productBy(data, OWING_PRODUCT);
  const owed = filter(
    data.invoices,
    invoice =>
      invoice.productId === product.id &&
      includes(InvoiceStatusGroups.UNPAID, invoice.status)
  );
  if (owed.length === 0) throw new Error("seed owes nothing on this product");
  for (const invoice of owed) assign(invoice, { dueDate });
  if (status !== undefined) assign(product, { status });
  return {
    owes: productHasUnpaidInvoices(data, contextFor(product)),
    tone: productUnpaidInvoiceTone(data, contextFor(product))
  };
}

function pinControl(data: MockDataset, verb: string): ButtonModuleAction {
  const control = find(supportPinActions(data), candidate =>
    candidate.value.startsWith(`${verb}:`)
  );
  if (control === undefined) {
    throw new Error(`the PIN panel offers no ${verb} control`);
  }
  return control;
}

function pinPanelText(data: MockDataset): string {
  return map(supportPinPanelItems(data), "value").join(" ");
}

function reveal(data: MockDataset): void {
  dispatchMockAction(data, {}, pinControl(data, MOCK_ACTION.PIN_REVEAL).value);
}

/** The reveal outlives a dataset reset, so each read-back starts it masked. */
function ensureMasked(data: MockDataset): void {
  if (!isSupportPinRevealed(data.persona)) return;
  dispatchMockAction(
    data,
    {},
    pinControl(data, MOCK_ACTION.PIN_COPY_AND_HIDE).value
  );
}

function setClipboard(clipboard: unknown): void {
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    configurable: true,
    writable: true
  });
}

// -----------------------------------------------------------------------------
// O-0 — the route's query reaches the page it was typed on
// -----------------------------------------------------------------------------

describe("O-0 — a page's own route carries the context it declares", () => {
  beforeEach(bothSeeds);
  afterEach(clearPageGlobals);

  it("every declared query member of the route context reaches the page's own context", async () => {
    const query = Object.fromEntries(
      map(values(ROUTE_QUERY_KEY), key => [key, `given-${key}`])
    );

    const context = await hostContextAt(() => import("~/pages/[...slug].vue"), {
      params: { slug: ["products"] },
      path: "/products",
      query
    });

    const threaded = Object.fromEntries(
      map(Object.entries(ROUTE_QUERY_KEY), ([member, key]) => [
        member,
        `given-${key}`
      ])
    );

    expect(size(ROUTE_QUERY_KEY)).toBeGreaterThan(0);
    expect(pick(context, keys(ROUTE_QUERY_KEY))).toEqual(threaded);
  });

  it("the thread pages from its own URL, and the fold goes once nothing is behind it", async () => {
    const data = hostgrid();
    const bodies = threadBodies(data);
    const control = moreControl(data);

    const opening = await threadPageText({});
    const asked = await threadPageText({ page: "2" });

    expect(bodies).toHaveLength(24);
    expect(control.label).toMatch(/\S/);
    expect(drawn(opening, bodies)).toBe(20);
    expect(opening).toContain(control.label);
    expect(drawn(asked, bodies)).toBe(24);
    expect(asked).not.toContain(control.label);
  });

  it("the address and the token a link carries reach the screen it opens", async () => {
    const email = "jonah@fieldnotes.app";
    const token = "eyJhbGciOiJIUzI1NiJ9.token-from-the-link";

    const { routeContext } = await hostedAt(
      () => import("~/pages/preferences/email/opt-ins.vue"),
      { email, token }
    );

    expect(routeContext).toEqual(expect.objectContaining({ email, token }));
  });
});

// -----------------------------------------------------------------------------
// O-1 — the delegate invitation link's landing
// -----------------------------------------------------------------------------

describe("O-1 — the link a delegate is invited by lands somewhere that reads it", () => {
  beforeEach(bothSeeds);
  afterEach(clearPageGlobals);

  it("a live link reads accepted, names what it grants, and points at it", async () => {
    const data = hostgrid();
    const invite = find(data.delegateInvites, { hash: LIVE_INVITE });
    const granted = find(data.products, { id: invite?.objectId });
    const reading = inviteReading(data, await inviteContext(LIVE_INVITE));

    const text = await invitePageText(LIVE_INVITE);

    expect(invite?.isExpired).toBeFalsy();
    expect(reading.tone).toBe("success");
    expect(reading.message).toContain(invite?.objectName);
    const control = requiredAction(reading.action);
    expect(control.value).toBe(
      mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/${granted?.groupSlug}/${granted?.id}`
      )
    );
    expect(control.label).toMatch(/\S/);
    expect(text).toContain(reading.title);
    expect(text).toContain(reading.message);
    expect(text).toContain(control.label);
  });

  it("an expired invite link reads as expired, and grants nothing", async () => {
    const data = hostgrid();
    const spent = find(data.delegateInvites, { hash: SPENT_INVITE });
    const live = inviteReading(data, await inviteContext(LIVE_INVITE));
    const reading = inviteReading(data, await inviteContext(SPENT_INVITE));

    const text = await invitePageText(SPENT_INVITE);

    expect(spent?.isExpired).toBe(true);
    expect(reading.message).toMatch(/expired or is invalid/i);
    expect(reading.tone).not.toBe(live.tone);
    expect(reading.title).not.toBe(live.title);
    expect(requiredAction(reading.action).value).not.toContain(
      `/${live.action?.value}`
    );
    expect(every(data.products, product => !includes(text, product.name))).toBe(
      true
    );
    expect(text).toContain(reading.message);
  });

  it("a hash nothing issued reads invalid too, and names nothing either", async () => {
    const data = hostgrid();
    const spent = inviteReading(data, await inviteContext(SPENT_INVITE));
    const reading = inviteReading(data, await inviteContext(UNKNOWN_INVITE));

    const text = await invitePageText(UNKNOWN_INVITE);

    expect(some(data.delegateInvites, { hash: UNKNOWN_INVITE })).toBe(false);
    expect(reading.message).toMatch(/expired or is invalid/i);
    expect(reading.tone).toBe(spent.tone);
    expect(every(data.products, product => !includes(text, product.name))).toBe(
      true
    );
  });

  it("the invitation page reads as verifying before it has a hash to check", async () => {
    const data = hostgrid();
    const spent = inviteReading(data, await inviteContext(SPENT_INVITE));
    const reading = inviteReading(data, await inviteContext());

    const text = await invitePageText("");

    expect(reading.title).not.toBe(spent.title);
    expect(reading.message).not.toBe(spent.message);
    expect(reading.tone).not.toBe(spent.tone);
    expect(reading.action).toBeUndefined();
    expect(text).toContain(reading.title);
    expect(text).toContain(reading.message);
  });
});

// -----------------------------------------------------------------------------
// O-2 — every product's standing has a reading
// -----------------------------------------------------------------------------

describe("O-2 — the condition banner covers the whole shelf", () => {
  beforeEach(bothSeeds);

  it("every seeded product draws the banner its own standing calls for", () => {
    const shelves = [hostgrid(), minimal()];

    for (const data of shelves) {
      expect(data.products.length).toBeGreaterThan(0);
      for (const product of data.products) {
        const reading = condition(data, product);
        expect({
          id: product.id,
          has: reading.has,
          title: reading.title.length > 0,
          message: reading.message.length > 0,
          tone: reading.tone !== undefined
        }).toEqual({
          id: product.id,
          has: true,
          title: true,
          message: true,
          tone: true
        });
      }
    }
  });

  it("a product renewing on schedule says so, dated, and offers its billing", () => {
    const data = hostgrid();
    const product = productBy(data, RENEWING_PRODUCT);

    const reading = condition(data, product);

    expect(product.autoRenew).toBe(true);
    expect(product.nextDueDate).toBeTruthy();
    expect(reading.tone).toBe("success");
    expect(reading.message).toContain(product.nextDueDate);
    expect(reading.action?.value).toBe(
      mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/${product.groupSlug}/${product.id}/billing`
      )
    );
    expect(reading.action?.label).toMatch(/\S/);
  });

  it("a fulfilled one-time purchase names the day it went live", () => {
    const data = clone();
    const product = productBy(data, FULFILLED_PRODUCT);
    const before = condition(data, product);

    assign(product, { purchasedAt: WENT_LIVE, createdAt: WENT_LIVE });
    const after = condition(data, product);

    expect(product.billingType).toBe("one-time");
    expect(product.status).toBe(ContractStatusCodes.ACTIVE);
    expect(before.tone).toBe("success");
    expect(before.message).not.toBe(after.message);
    expect(after.message).toContain(WENT_LIVE);
  });

  it("a product on trial says when the trial runs out", () => {
    const seeded = minimal();
    const onTrial = soleProduct(seeded);
    const data = clone();
    const cloned = productBy(data, RENEWING_PRODUCT);
    assign(cloned, { trialEndsAt: TRIAL_ENDS });

    const seededReading = condition(seeded, onTrial);
    const clonedReading = condition(data, cloned);

    expect(onTrial.trialEndsAt).toBeTruthy();
    expect(seededReading.tone).toBe("info");
    expect(seededReading.message).toContain(onTrial.trialEndsAt);
    expect(clonedReading.tone).toBe("info");
    expect(clonedReading.message).toContain(TRIAL_ENDS);
  });

  it("a cancelled contract and a lapsed one each read quietly, on their own dates", () => {
    const data = clone();
    const cancelled = productBy(data, CANCELLED_PRODUCT);
    const lapsing = productBy(data, RENEWING_PRODUCT);
    assign(lapsing, {
      status: ContractStatusCodes.CLOSED,
      cancelledAt: LAPSED_ON
    });

    const stopped = condition(data, cancelled);
    const lapsed = condition(data, lapsing);

    expect(cancelled.cancelledAt).toBeTruthy();
    expect(stopped.tone).toBe("neutral");
    expect(stopped.message).toContain(cancelled.cancelledAt);
    expect(lapsed.tone).toBe("neutral");
    expect(lapsed.message).toContain(LAPSED_ON);
    expect(lapsed.title).not.toBe(stopped.title);
  });

  it("a product with nothing else standing says only that it is running", () => {
    const data = clone();
    const product = productBy(data, RENEWING_PRODUCT);
    const renewing = condition(data, product);

    assign(product, { autoRenew: false, nextDueDate: undefined });
    const bare = condition(data, product);

    expect(bare.has).toBe(true);
    expect(bare.tone).toBe("success");
    expect(bare.message).toMatch(/\S/);
    expect(bare.message).not.toBe(renewing.message);
    expect(bare.action).toBeUndefined();
  });

  it("a product awaiting activation reads as awaiting activation, and offers no setup form", () => {
    const asking = awaitingActivation(true);
    const ready = awaitingActivation(false);

    expect(asking.status).toBe(ContractStatusCodes.AWAITING_ACTIVATION);
    expect(asking.fields).toBeGreaterThan(0);
    expect(asking.action?.value).toBe(
      mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/products/${AWAITING_PRODUCT}/setup`
      )
    );
    expect(ready.fields).toBe(0);
    expect(ready.has).toBe(true);
    expect(ready.tone).toBe("info");
    expect(ready.tone).not.toBe(asking.tone);
    expect(ready.title).not.toBe(asking.title);
    expect(ready.message).not.toBe(asking.message);
    expect(ready.action).toBeUndefined();
  });

  it("a cancellation booked for a future day says which day, ahead of a merely lodged one", () => {
    const kinds = values(CancellationRequestStatusCodes);
    const booked = cancellingAt(
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
    );
    const lodged = map(
      reject(
        kinds,
        kind =>
          kind ===
          CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
      ),
      kind => cancellingAt(kind)
    );

    expect(kinds).toHaveLength(5);
    expect(booked.message).toContain(STOPS_ON);
    expect(booked.message).not.toContain(ASKED_ON);
    expect(booked.action?.value).toBe(
      mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, RENEWING_PRODUCT)
    );
    for (const reading of lodged) {
      expect(reading.message).toContain(ASKED_ON);
      expect(reading.message).not.toBe(booked.message);
      expect(reading.title).not.toBe(booked.title);
    }
  });

  it("a booked cancellation with no day yet reads as merely lodged", () => {
    const booked = cancellingAt(
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
    );
    const undated = cancellingWithNoDay(
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
    );
    const lodged = cancellingAt(
      CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
    );

    expect(booked.message).toContain(STOPS_ON);
    expect(undated.title).toBe(lodged.title);
    expect(undated.title).not.toBe(booked.title);
    expect(undated.message).toContain(ASKED_ON);
    expect(undated.message).not.toContain(STOPS_ON);
    expect(undated.message).not.toMatch(/undefined|null|NaN|Invalid/i);
    expect(undated.action?.value).toBe(
      mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, RENEWING_PRODUCT)
    );
  });
});

// -----------------------------------------------------------------------------
// O-3 — the thread's own standing
// -----------------------------------------------------------------------------

describe("O-3 — a thread reads its own standing", () => {
  it("the thread reads the sentence its own status names", () => {
    const codes = values(TicketStatusCodes);
    const readings = map(codes, status => standingAt(status, "tkt-208"));
    const scheduled = standingAt(TicketStatusCodes.SCHEDULED, "tkt-208");
    const closed = standingAt(TicketStatusCodes.CLOSED, "tkt-208");

    expect(codes).toHaveLength(6);
    expect(every(readings, reading => reading.message.length > 0)).toBe(true);
    expect(uniq(map(readings, "title"))).toHaveLength(codes.length);
    expect(uniq(map(readings, "message"))).toHaveLength(codes.length);
    expect(scheduled.message).toContain(BOOKED_DAY);
    expect(scheduled.message).not.toContain(UPDATED_DAY);
    expect(closed.message).toContain(UPDATED_DAY);
    expect(closed.message).not.toContain(BOOKED_DAY);
  });
});

// -----------------------------------------------------------------------------
// O-4 — the company a product is invoiced as
// -----------------------------------------------------------------------------

describe("O-4 — a product is invoiced to an address as a company", () => {
  beforeEach(bothSeeds);

  it("choosing one raises this product's invoices to that company", () => {
    const data = hostgrid();
    const product = productBy(data, RENEWING_PRODUCT);
    const company = seededCompany(data);
    const row = companyRow(
      productCompanyItems(data, contextFor(product)),
      company.id
    );

    const result = dispatchMockAction(
      data,
      contextFor(product),
      row.action?.value ?? ""
    );

    expect(row.action?.value).toBe(
      mockActionValue(
        MOCK_ACTION.SET_PRODUCT_BILLING_COMPANY,
        `${product.id}:${company.id}`
      )
    );
    expect(product.billingCompanyId).toBe(company.id);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("a company the account does not hold is refused, and the product is left as it was", () => {
    const data = hostgrid();
    const product = productBy(data, RENEWING_PRODUCT);
    const before = JSON.stringify(data);

    const strangeCompany = dispatchMockAction(
      data,
      contextFor(product),
      mockActionValue(
        MOCK_ACTION.SET_PRODUCT_BILLING_COMPANY,
        `${product.id}:${ABSENT_ID}`
      )
    );
    const strangeProduct = dispatchMockAction(
      data,
      {},
      mockActionValue(
        MOCK_ACTION.SET_PRODUCT_BILLING_COMPANY,
        `${ABSENT_ID}:${seededCompany(data).id}`
      )
    );

    expect(some(data.companies, { id: ABSENT_ID })).toBe(false);
    expect(strangeCompany?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(strangeCompany?.confirm).toBeUndefined();
    expect(strangeCompany?.form).toBeUndefined();
    expect(strangeProduct?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(product.billingCompanyId).toBeUndefined();
    expect(JSON.stringify(data)).toBe(before);
  });
});

// -----------------------------------------------------------------------------
// O-5 — how loudly the unpaid notice reads
// -----------------------------------------------------------------------------

describe("O-5 — a debt in hand reads louder than a debt in prospect", () => {
  it("the unpaid notice reads louder where the product is suspended or the invoice is overdue", () => {
    const waiting = owingClone(FUTURE_DUE);
    const suspended = owingClone(FUTURE_DUE, ContractStatusCodes.SUSPENDED);
    const overdue = owingClone(PAST_DUE);

    expect([waiting.owes, suspended.owes, overdue.owes]).toEqual([
      true,
      true,
      true
    ]);
    expect(waiting.tone).toBe("warning");
    expect(suspended.tone).toBe("danger");
    expect(overdue.tone).toBe("danger");
  });
});

// -----------------------------------------------------------------------------
// O-6 — the PIN, while it is revealed
// -----------------------------------------------------------------------------

describe("O-6 — the revealed PIN is copied on its way back behind the mask", () => {
  beforeEach(() => {
    bothSeeds();
    ensureMasked(hostgrid());
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("the PIN reaches the clipboard before it is hidden", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const data = hostgrid();
    const pin = data.persona.supportPin ?? "";
    reveal(data);

    const result = dispatchMockAction(
      data,
      {},
      pinControl(data, MOCK_ACTION.PIN_COPY_AND_HIDE).value
    );
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());

    expect(pin).toMatch(/^\d{4}$/);
    expect(writeText).toHaveBeenCalledWith(pin);
    expect(isSupportPinRevealed(data.persona)).toBe(false);
    expect(pinPanelText(data)).not.toContain(pin);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("the control offering it stands only while the PIN is on screen, and the row copies", () => {
    const data = hostgrid();
    const masked = supportPinActions(data);
    reveal(data);
    const revealed = supportPinActions(data);

    expect(
      some(masked, action =>
        action.value.startsWith(`${MOCK_ACTION.PIN_COPY_AND_HIDE}:`)
      )
    ).toBe(false);
    expect(pinControl(data, MOCK_ACTION.PIN_COPY_AND_HIDE).value).toBe(
      mockActionValue(MOCK_ACTION.PIN_COPY_AND_HIDE, data.persona.id)
    );
    expect(pinControl(data, MOCK_ACTION.PIN_COPY_AND_HIDE).label).toMatch(
      /copy and hide/i
    );
    expect(
      some(revealed, action =>
        action.value.startsWith(`${MOCK_ACTION.PIN_REVEAL}:`)
      )
    ).toBe(false);
    expect(some(supportPinPanelItems(data), { copyable: true })).toBe(true);
  });
});
