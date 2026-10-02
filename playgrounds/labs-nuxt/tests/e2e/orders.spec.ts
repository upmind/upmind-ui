// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — a hand drives the two composables (AC-22)
 *
 * ## Job To Be Done
 * Prove the `@AC-22` scenario over the pinned recorded corpus (design 8.12).
 * The COLLECTION renders on the SHARED playground renderer (the `/useInvoices`
 * twin): a hand sees the recorded rows, the filter bar's search and status
 * multi-select, the sort toolbar and the pager each send the `GET api/invoices`
 * keys and window the design names, and a row's open control reaches the
 * RECORD view.
 *
 * The RECORD (`/useOrder/:oid`) now renders on the SHARED record renderer (the
 * `/useInvoice` twin — operator ruling 2026-10-02, commit 3ff03fc3d). The order
 * opens on mount (an id in the route needs no button press), so its single read
 * fires once on load. The record draws the opened order whole: its number as
 * the title, the status badge, the details, the items and the summary from the
 * recorded order. Pay now is drawn while the order can pay; its `?init=pay`
 * intent routes to the shared payment overlay (`/useOrder/:oid/payment`).
 *
 * The `bdd` project drives the six collection scenarios of the same feature;
 * `orders.driven.jq` holds that run to exactly those six. This lane
 * holds what the World seam cannot express: the rendered surface, the outbound
 * requests and the single read. No assertion counts served rows (design 8.12,
 * replay limits).
 *
 * The filter-bar status control (former known gap, operator ruling 2026-09-29)
 * now writes `filter[status.code|eq]` from its multi-select eq leaf — proven
 * live below (operator ruling 2026-10-01, gap closed).
 *
 * ## What Breaks If These Fail
 * A hand on the playground cannot reach the orders, a control writes criteria
 * the wire never carries, the record draws the wrong order or no Pay now on a
 * payable order, or the order view reads the order more than once on load.
 */

import { expect, test } from "@playwright/test";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  OrderPage,
  OrdersPage,
  isListRead,
  isRecordRead
} from "../support/orders.po";
import { ORDERS_PINS } from "./catalogs.pins";
import {
  installRecordedCorpus,
  moduleRecordings,
  seedRecordedClientSession
} from "./recorded-corpus";
import type { Request } from "@playwright/test";

// -----------------------------------------------------------------------------

const recordedBody = getFixture("get-invoices-id-case-order-unpaid", {
  recordingsDir: moduleRecordings("orders")
}).response.body as {
  data: {
    id: string;
    number: string;
    status: { name: string };
    current_data: { content: { products: { name: string }[] } };
  };
};

const recordedOrder = {
  id: recordedBody.data.id,
  number: recordedBody.data.number,
  statusName: recordedBody.data.status.name,
  itemName: recordedBody.data.current_data.content.products[0].name.trim()
};

const params = (request: Request) => new URL(request.url()).searchParams;

test.describe.configure({ timeout: 240000 });

test.beforeEach(async ({ page }) => {
  await installRecordedCorpus(page, "orders", ORDERS_PINS);
  await seedRecordedClientSession(page);
});

// -----------------------------------------------------------------------------

test("@FE-3237 AC-22 A hand drives the two composables — the shared renderer lists the client's recorded orders", async ({
  page
}) => {
  const orders = new OrdersPage(page);
  await orders.open();

  await expect(orders.rows().first()).toBeVisible({ timeout: 150000 });
  expect(await orders.rows().count()).toBeGreaterThan(0);
  await expect(orders.filterBar()).toBeVisible();
});

test("@FE-3237 AC-22 A hand drives the two composables — a search sends filter[number|eq] on the first window", async ({
  page
}) => {
  const orders = new OrdersPage(page);
  await orders.open();

  const searched = page.waitForRequest(
    request => isListRead(request) && params(request).has("filter[number|eq]"),
    { timeout: 30000 }
  );
  await orders.search(recordedOrder.number);
  const query = params(await searched);

  expect(query.get("filter[number|eq]")).toBe(recordedOrder.number);
  expect(query.getAll("filter[category.slug]")).toEqual(["new_contract"]);
  expect(query.get("offset")).toBe("0");
  expect(query.get("limit")).toBe("10");
  expect(query.has("query")).toBe(false);
});

test("@FE-3237 AC-22 A hand drives the two composables — the filter bar status control sends filter[status.code|eq]", async ({
  page
}) => {
  const orders = new OrdersPage(page);
  await orders.open();

  const sent = page.waitForRequest(
    request =>
      isListRead(request) && params(request).has("filter[status.code|eq]"),
    { timeout: 30000 }
  );
  await orders.filterStatus("invoice_paid");
  const query = params(await sent);

  expect(query.get("filter[status.code|eq]")).toBe("invoice_paid");
  expect(query.getAll("filter[category.slug]")).toEqual(["new_contract"]);
});

test("@FE-3237 AC-22 A hand drives the two composables — the sort toolbar writes the sort and a page move sends the next window", async ({
  page
}) => {
  const orders = new OrdersPage(page);
  await orders.open();

  const sorted = page.waitForRequest(
    request =>
      isListRead(request) && params(request).get("order") === "created_at",
    { timeout: 30000 }
  );
  await orders.toggleSort();
  expect(params(await sorted).getAll("filter[category.slug]")).toEqual([
    "new_contract"
  ]);

  const moved = page.waitForRequest(
    request => isListRead(request) && params(request).get("offset") === "10"
  );
  await orders.nextPage();
  const pageTwo = params(await moved);

  expect(pageTwo.get("limit")).toBe("10");
  expect(pageTwo.getAll("filter[category.slug]")).toEqual(["new_contract"]);
});

test("@FE-3237 AC-22 A hand drives the two composables — a row's open control reaches the order's record view", async ({
  page
}) => {
  const orders = new OrdersPage(page);
  await orders.open();

  await orders.openOrder();
  await expect(page).toHaveURL(/\/useOrder\/[^/]+/);
});

test("@FE-3237 AC-22 A hand drives the two composables — the record draws the opened order whole on the shared surface", async ({
  page
}) => {
  const order = new OrderPage(page);
  await order.open(recordedOrder.id);

  await expect(order.title()).toContainText(recordedOrder.number);
  await expect(order.status()).toContainText(recordedOrder.statusName);
  await expect(order.section("details")).toBeVisible();
  await expect(order.section("line-items")).toContainText(
    recordedOrder.itemName
  );
  await expect(order.section("summary")).toBeVisible();
  await expect(order.footer()).toBeVisible();
});

test("@FE-3237 AC-22 A hand drives the two composables — Pay now shows on a payable order and opens the pay overlay", async ({
  page
}) => {
  const order = new OrderPage(page);
  await order.open(recordedOrder.id);

  await expect(order.payNow()).toBeVisible();
  await order.pay();

  await expect(order.paymentOverlay()).toBeVisible();
  await expect(page).toHaveURL(/\/useOrder\/[^/]+\/payment/);
});

test("@FE-3237 AC-22 A hand drives the two composables — the record reads the order once on load", async ({
  page
}) => {
  const reads: Request[] = [];
  page.on("request", request => {
    if (isRecordRead(request)) reads.push(request);
  });

  const order = new OrderPage(page);
  await order.open(recordedOrder.id);
  await expect(order.title()).toContainText(recordedOrder.number);
  await page.waitForLoadState("networkidle");

  expect(reads).toHaveLength(1);
  expect(
    new URL(reads[0].url()).pathname.endsWith(
      `/api/invoices/${recordedOrder.id}`
    )
  ).toBe(true);
});
