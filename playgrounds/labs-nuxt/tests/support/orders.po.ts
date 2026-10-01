// -----------------------------------------------------------------------------
/**
 * @module tests/support/orders.po
 * @description Page objects for the two orders scenario pages. The
 * COLLECTION (`/useOrders`) renders on the SHARED playground renderer
 * (`ScenarioPlayground` → `ListSurface`), the twin of `/useInvoices`: its
 * locators are the renderer's own structural keys — the `filters` bar, each
 * `row`, the `pagination-region`, the `filter-multi-select` status control and
 * its `option-tile` choices (keyed by the wire status value), and the row's
 * `open-order`/`view` actions. The MANAGER (`/useOrder`) stays self-drawn,
 * keyed `order-<member>` by the design 8.12 rule.
 */

import { kebabCase, map } from "lodash-es";
import type { Locator, Page, Request } from "@playwright/test";

// -----------------------------------------------------------------------------

/** The members of `useOrder` that design 8.6 publishes. */
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

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/useOrders");
    await this.rows().first().waitFor({ timeout: 150000 });
  }

  filterBar(): Locator {
    return this.page.getByTestId("filters");
  }

  rows(): Locator {
    return this.page.getByTestId("row");
  }

  pagination(): Locator {
    return this.page.getByTestId("pagination-region");
  }

  async nextPage(): Promise<void> {
    await this.pagination().getByRole("button").last().click();
  }

  async search(term: string): Promise<void> {
    const box = this.filterBar()
      .locator('[data-test-value="filters-number-eq"] input')
      .first();
    await box.fill(term);
    await box.press("Enter");
  }

  /** Flips the toolbar sort direction on the active field (the `sort-field` select's sibling). */
  async toggleSort(): Promise<void> {
    await this.page
      .locator(
        '[data-test-key="sort"] button:not([data-test-key="sort-field"])'
      )
      .first()
      .click();
  }

  /**
   * Picks one value of the shared filter bar's `status.code` multi-select — open
   * the control, then the `option-tile` whose `data-test-value` is the wire
   * status (`invoice_paid`), so the locator never reads a translated label.
   */
  async filterStatus(value: string): Promise<void> {
    await this.filterBar()
      .locator(
        '[data-test-key="filter-multi-select"][data-test-value="filters.status.code.eq"]'
      )
      .first()
      .click();
    await this.page
      .locator(`[data-test-key="option-tile"][data-test-value="${value}"]`)
      .first()
      .click();
  }

  async openOrder(): Promise<void> {
    await this.rows()
      .first()
      .locator('[data-test-value="open-order"]')
      .first()
      .click();
  }
}

export class OrderPage {
  constructor(private readonly page: Page) {}

  async open(orderId: string): Promise<void> {
    await this.page.goto(`/useOrder/${orderId}`);
    await this.page.getByTestId("order-page").waitFor({ timeout: 150000 });
  }

  member(member: string): Locator {
    return this.page.getByTestId(memberKey("order", member)).first();
  }

  async enter(): Promise<void> {
    await this.page.getByTestId("order-enter").click();
  }

  async leave(): Promise<void> {
    await this.page.getByTestId("order-leave").click();
  }

  detailNumber(): Locator {
    return this.page.getByTestId("order-detail-number");
  }
}

/** `schemas.query` → `schemas-query`, `hasNextPage` → `has-next-page`. */
const memberKey = (prefix: string, member: string): string =>
  `${prefix}-${map(member.split("."), kebabCase).join("-")}`;
