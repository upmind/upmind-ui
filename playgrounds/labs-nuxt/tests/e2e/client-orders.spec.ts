// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — a hand drives the two composables (AC-22)
 *
 * ## Job To Be Done
 * Prove the `@AC-22` scenario on the two playground pages, over the pinned
 * recorded corpus (design 8.12): every published member of design 8.6 is
 * reachable by its test key; the playground filter bar's status control, the
 * search and a page move each send the `GET api/invoices` keys and window the
 * design names; and each enter of the order view reads the order again, so
 * the manager single read counts `N + 1` after the second enter.
 *
 * The `bdd` project drives the six collection scenarios of the same feature;
 * `client-orders.driven.jq` holds that run to exactly those six. This lane
 * holds what the World seam cannot express: the test keys, the outbound
 * requests and the re-reads. No assertion counts served rows (design 8.12,
 * replay limits).
 *
 * ## What Breaks If These Fail
 * A hand on the playground cannot reach a member, a control writes criteria
 * the wire never carries, or the order view shows a stale order after the
 * client comes back to it.
 */

import { expect, test } from "@playwright/test";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  COLLECTION_MEMBERS,
  ClientOrderPage,
  ClientOrdersPage,
  MANAGER_MEMBERS,
  isListRead,
  isManagerRead
} from "../support/client-orders.po";
import { CLIENT_ORDERS_PINS } from "./catalogs";
import {
  installRecordedCorpus,
  moduleRecordings,
  seedRecordedClientSession
} from "./recorded-corpus";
import { filter } from "lodash-es";
import type { Request } from "@playwright/test";

// -----------------------------------------------------------------------------

const recordedOrder = getFixture("get-invoices-id-case-order-unpaid", {
  recordingsDir: moduleRecordings("client-orders")
}).response.body as { data: { id: string; number: string } };

const params = (request: Request) => new URL(request.url()).searchParams;

test.describe.configure({ timeout: 240000 });

test.beforeEach(async ({ page }) => {
  await installRecordedCorpus(page, "client-orders", CLIENT_ORDERS_PINS);
  await seedRecordedClientSession(page);
});

// -----------------------------------------------------------------------------

test("@FE-3237 AC-22 A hand drives the two composables — every published member of the collection is reachable on its page", async ({
  page
}) => {
  const orders = new ClientOrdersPage(page);
  await orders.open();

  const unreachable: string[] = [];
  for (const member of COLLECTION_MEMBERS) {
    if (!(await orders.member(member).isVisible())) unreachable.push(member);
  }

  expect(unreachable).toEqual([]);
});

test("@FE-3237 AC-22 A hand drives the two composables — every published member of the manager is reachable in the order view", async ({
  page
}) => {
  const order = new ClientOrderPage(page);
  await order.open(recordedOrder.data.id);
  await order.enter();
  await expect(order.detailNumber()).toHaveText(recordedOrder.data.number);

  const unreachable: string[] = [];
  for (const member of MANAGER_MEMBERS) {
    if (!(await order.member(member).isVisible())) unreachable.push(member);
  }

  expect(unreachable).toEqual([]);
});

// KNOWN GAP — operator ruling 2026-09-29, known gap. The design-system form
// renderer (design-system/packages/ui/src/form/renderers/utils.ts) writes the
// eq/neq child of the dotted status.code object one level too deep, so the write
// is dropped. The data layer is correct: the headless dotted-operators int tests
// prove the wire. No design-system change in this story.
test.fixme("@FE-3237 AC-22 A hand drives the two composables — the filter bar status control sends filter[status.code|eq]=invoice_paid", async ({
  page
}) => {
  const orders = new ClientOrdersPage(page);
  await orders.open();

  const sent = page.waitForRequest(
    request =>
      isListRead(request) && params(request).has("filter[status.code|eq]"),
    { timeout: 30000 }
  );
  await orders.filterBarStatus("invoice_paid");
  const query = params(await sent);

  expect(query.get("filter[status.code|eq]")).toBe("invoice_paid");
  expect(query.getAll("filter[category.slug]")).toEqual(["new_contract"]);
});

test("@FE-3237 AC-22 A hand drives the two composables — a page move sends the next window, and a search sends filter[number|eq] on the first window", async ({
  page
}) => {
  const orders = new ClientOrdersPage(page);
  await orders.open();

  const moved = page.waitForRequest(
    request => isListRead(request) && params(request).get("offset") === "10"
  );
  await orders.nextPage();
  const pageTwo = params(await moved);

  expect(pageTwo.get("limit")).toBe("10");
  expect(pageTwo.getAll("filter[category.slug]")).toEqual(["new_contract"]);
  await expect(orders.pagination()).toContainText("2 / ");

  const searched = page.waitForRequest(
    request => isListRead(request) && params(request).has("filter[number|eq]"),
    { timeout: 30000 }
  );
  await orders.search(recordedOrder.data.number);
  const search = params(await searched);

  expect(search.get("filter[number|eq]")).toBe(recordedOrder.data.number);
  expect(search.getAll("filter[category.slug]")).toEqual(["new_contract"]);
  expect(search.get("offset")).toBe("0");
  expect(search.get("limit")).toBe("10");
  expect(search.has("query")).toBe(false);
});

test("@FE-3237 AC-22 A hand drives the two composables — each enter of the order view reads the order again", async ({
  page
}) => {
  const reads: Request[] = [];
  page.on("request", request => {
    if (isManagerRead(request)) reads.push(request);
  });

  const order = new ClientOrderPage(page);
  await order.open(recordedOrder.data.id);

  await order.enter();
  await expect(order.detailNumber()).toHaveText(recordedOrder.data.number);
  await page.waitForLoadState("networkidle");
  const settled = reads.length;

  await order.leave();
  await order.enter();
  await expect(order.detailNumber()).toHaveText(recordedOrder.data.number);

  await expect.poll(() => reads.length).toBe(settled + 1);
  await page.waitForLoadState("networkidle");
  expect(reads.length).toBe(settled + 1);
  expect(
    filter(reads, read =>
      read.url().includes(`/api/invoices/${recordedOrder.data.id}`)
    )
  ).toHaveLength(reads.length);
});
