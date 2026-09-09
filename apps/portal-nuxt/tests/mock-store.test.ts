import { afterEach, describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { filter, find } from "lodash-es";
import {
  useMockCatalogue,
  useMockContractProduct,
  useMockNotifications,
  useMockTicket
} from "~/portal/mock/facades";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { activeProductItems } from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

/**
 * The interactive-lite mock layer (plan §1.3, §4): facade actions mutate the
 * live dataset optimistically, selectors derive module props from it, and a
 * reset reseeds — no persistence, no API. Paired blind with
 * tests/mock-store.must-fail.patch.
 */
describe("mock store — seeding and reset", () => {
  afterEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("returns one shared live dataset per brand, reseeded after reset", () => {
    const first = useMockData(MOCK_DATASET_ID.HOSTGRID);
    expect(useMockData(MOCK_DATASET_ID.HOSTGRID)).toBe(first);

    useMockContractProduct(first, "prod-team").useActions().completeSetup();
    resetMockData(MOCK_DATASET_ID.HOSTGRID);

    const reseeded = useMockData(MOCK_DATASET_ID.HOSTGRID);
    expect(reseeded).not.toBe(first);
    expect(find(reseeded.products, { id: "prod-team" })?.status).toBe(
      ContractStatusCodes.AWAITING_ACTIVATION
    );
  });

  it("completeSetup activates a product awaiting setup; the panel follows", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    // Derived from the seed: what is under test is that the panel FOLLOWS the
    // mutation, not how many products the brand happens to be waiting on.
    const flaggedSeeded = filter(activeProductItems(data), item =>
      item.description?.includes("Action Needed")
    ).length;
    expect(flaggedSeeded).toBeGreaterThan(0);

    useMockContractProduct(data, "prod-team").useActions().completeSetup();

    expect(find(data.products, { id: "prod-team" })?.status).toBe(
      ContractStatusCodes.ACTIVE
    );
    expect(
      filter(activeProductItems(data), item =>
        item.description?.includes("Action Needed")
      )
    ).toHaveLength(flaggedSeeded - 1);
  });

  it("a seed refuses mutation, so a caller handing it the raw constant cannot poison the reset point", () => {
    expect(() =>
      useMockNotifications(HOSTGRID_MOCK_DATASET).useActions().markAllRead()
    ).toThrowError();
    expect(
      find(HOSTGRID_MOCK_DATASET.notifications, { read: false })
    ).toBeDefined();
  });

  it("placeOrder charges the plain amount, never the recurring rate", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = find(data.catalogue, { id: "cat-pro" });

    const order = useMockCatalogue(data)
      .useActions()
      .placeOrder("cat-pro")?.entity;

    expect(item?.price.formatted).toBe("£99.00");
    expect(item?.billingTerm).toBe("Monthly");
    expect(order?.total.formatted).toBe("£99.00");
    expect(data.invoices[0]?.total.formatted).toBe("£99.00");
    expect(data.invoices[0]?.lines?.[0]?.amount.formatted).toBe("£99.00");
  });

  it("a placed order's id and its document number name the same sequence", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const order = useMockCatalogue(data)
      .useActions()
      .placeOrder("cat-pro")?.entity;

    expect(order?.number).toBe(order?.id.toUpperCase());
    expect(data.invoices[0]?.number).toBe(data.invoices[0]?.id.toUpperCase());
  });

  it("the ordered product carries its billing type, so the listing's type filter still finds it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    useMockCatalogue(data).useActions().placeOrder("cat-pro");

    expect(data.products[0]?.billingType).toBe(
      find(data.catalogue, { id: "cat-pro" })?.billingType
    );
  });

  it("reply appends the persona's message and moves the thread's timestamp", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const before = find(data.tickets, { id: "tkt-207" })?.messages.length ?? 0;

    const reply = useMockTicket(data, "tkt-207")
      .useActions()
      .reply({ body: "It is the sales mailbox." })?.entity;

    const ticket = find(data.tickets, { id: "tkt-207" });
    expect(ticket?.messages).toHaveLength(before + 1);
    expect(ticket?.messages.at(-1)?.author).toBe(data.persona.name);
    expect(ticket?.messages.at(-1)?.body).toBe("It is the sales mailbox.");
    expect(ticket?.updatedAt).toBe(reply?.sentAt);
  });

  it("markAllRead flips every unread notification", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    useMockNotifications(data).useActions().markAllRead();
    expect(find(data.notifications, { read: false })).toBeUndefined();
  });

  it("activeProductItems excludes cancelled products and flags pending ones", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const items = activeProductItems(data);

    expect(find(items, { id: "prod-starter" })).toBeUndefined();
    expect(find(items, { id: "prod-team" })?.description).toContain(
      "Action Needed"
    );
    expect(find(items, { id: "prod-analytics" })?.description).not.toContain(
      "Action Needed"
    );
  });
});
