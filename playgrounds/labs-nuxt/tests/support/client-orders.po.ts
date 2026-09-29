// -----------------------------------------------------------------------------
/**
 * @module tests/support/client-orders.po
 * @description Page objects for the two client-orders scenario pages. Every
 * locator is a test key built by the design 8.12 key rule —
 * `client-orders-<member>` on the collection page, `client-order-<member>`
 * on the order page, `<member>` in kebab case — or a key of the shared
 * playground filter bar (`runtime/components/FilterBar.vue`).
 */

import { kebabCase, map } from "lodash-es";
import type { Locator, Page, Request } from "@playwright/test";

// -----------------------------------------------------------------------------

/** The members of `useClientOrders` that design 8.6 publishes. */
export const COLLECTION_MEMBERS = [
  "data",
  "error",
  "pagination",
  "query",
  "schemas.query",
  "findOne",
  "getOne",
  "isAvailable",
  "isEmpty",
  "isLoading",
  "hasError",
  "hasNextPage",
  "hasPrevPage",
  "hasPages",
  "isMultibrand",
  "showStore",
  "storefrontUrl",
  "filters.query",
  "filters.status",
  "filters.total",
  "filters.dateCreated",
  "filters.datePaid",
  "filters.itemName",
  "filters.categoryName",
  "filters.serviceIdentifier",
  "filterBy",
  "sortBy",
  "sort",
  "nextPage",
  "prevPage",
  "setPage",
  "setLimit",
  "refresh",
  "invalidate",
  "reset",
  "destroy",
  "isReady"
] as const;

/** The members of `useClientOrder` that design 8.6 publishes. */
export const MANAGER_MEMBERS = [
  "data",
  "detail",
  "products",
  "error",
  "contractId",
  "isDue",
  "isPayable",
  "isCancellable",
  "isOverdue",
  "isPaid",
  "isCancelled",
  "isPartiallyPaid",
  "canPay",
  "canCancel",
  "hasPendingPayment",
  "isDelegated",
  "hasOnlineGateways",
  "isAvailable",
  "isComplete",
  "isEmpty",
  "isLoading",
  "isProcessing",
  "hasError",
  "refresh",
  "invalidate",
  "reset",
  "destroy",
  "isReady",
  "usePayment",
  "cancel"
] as const;

/** `schemas.query` → `schemas-query`, `hasNextPage` → `has-next-page`. */
const memberKey = (prefix: string, member: string) =>
  `${prefix}-${map(member.split("."), kebabCase).join("-")}`;

/** Whether a request is the collection read `GET api/invoices`. */
export const isListRead = (request: Request): boolean =>
  request.method() === "GET" &&
  new URL(request.url()).pathname.endsWith("/api/invoices");

/** Whether a request is the manager single read (`with_staged_imports=1`). */
export const isManagerRead = (request: Request): boolean => {
  const url = new URL(request.url());
  return (
    request.method() === "GET" &&
    /\/api\/invoices\/[^/]+$/.test(url.pathname) &&
    url.searchParams.get("with_staged_imports") === "1"
  );
};

// -----------------------------------------------------------------------------

export class ClientOrdersPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/useClientOrders");
    await this.page
      .getByTestId("client-orders-page")
      .waitFor({ timeout: 150000 });
  }

  member(member: string): Locator {
    return this.page.getByTestId(memberKey("client-orders", member)).first();
  }

  pagination(): Locator {
    return this.member("pagination");
  }

  async nextPage(): Promise<void> {
    await this.member("nextPage").click();
  }

  async search(term: string): Promise<void> {
    const box = this.member("filters.query");
    await box.fill(term);
    await box.press("Enter");
  }

  /**
   * Chooses one value of the playground filter bar's `status.code` eq
   * control. The page mounts the bar as its `schemas.query` member.
   */
  async filterBarStatus(value: string): Promise<void> {
    await this.member("schemas.query")
      .getByTestId("option-tile-group")
      .first()
      .getByTestId("option-tile")
      .filter({ hasText: new RegExp(`^${value}$`) })
      .click({ timeout: 30000 });
  }
}

export class ClientOrderPage {
  constructor(private readonly page: Page) {}

  async open(orderId: string): Promise<void> {
    await this.page.goto(`/useClientOrder/${orderId}`);
    await this.page
      .getByTestId("client-order-page")
      .waitFor({ timeout: 150000 });
  }

  member(member: string): Locator {
    return this.page.getByTestId(memberKey("client-order", member)).first();
  }

  async enter(): Promise<void> {
    await this.page.getByTestId("client-order-enter").click();
  }

  async leave(): Promise<void> {
    await this.page.getByTestId("client-order-leave").click();
  }

  detailNumber(): Locator {
    return this.page.getByTestId("client-order-detail-number");
  }
}
