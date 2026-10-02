// -----------------------------------------------------------------------------
/**
 * @module tests/support/orders.po
 * @description Page objects for the two orders scenario pages. The
 * COLLECTION (`/useOrders`) renders on the SHARED playground renderer
 * (`ScenarioPlayground` → `ListSurface`), the twin of `/useInvoices`: its
 * locators are the renderer's own structural keys — the `filters` bar, each
 * `row`, the `pagination-region`, the `filter-multi-select` status control and
 * its `option-tile` choices (keyed by the wire status value), and the row's
 * `open-order`/`view` actions.
 *
 * The RECORD (`/useOrder/:oid`) now renders on the SHARED record renderer
 * (`RecordSurface`), the twin of `/useInvoice` (operator ruling 2026-10-02,
 * commit 3ff03fc3d): it opens on load and draws the order whole — `record-title`
 * from the header, the `record-status` badge, one `record-section-<key>` per
 * declared section, each `record-field-<kebab(i18n)>`, and the `record-footer`.
 * Its Pay now is the header action keyed by the kebab of its label; pressing it
 * opens the shared `?init=pay` overlay. The former self-drawn manager keys
 * (`order-<member>`, `order-enter`, `order-leave`) are gone.
 */

import type { Locator, Page, Request } from "@playwright/test";

// -----------------------------------------------------------------------------

/** Whether a request is the collection read `GET api/invoices`. */
export const isListRead = (request: Request): boolean =>
  request.method() === "GET" &&
  new URL(request.url()).pathname.endsWith("/api/invoices");

/** Whether a request is the record single read (`with_staged_imports=1`). */
export const isRecordRead = (request: Request): boolean => {
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
    await this.surface().waitFor({ timeout: 150000 });
  }

  surface(): Locator {
    return this.page.getByTestId("record-surface");
  }

  title(): Locator {
    return this.page.getByTestId("record-title");
  }

  status(): Locator {
    return this.page.getByTestId("record-status");
  }

  footer(): Locator {
    return this.page.getByTestId("record-footer");
  }

  section(key: string): Locator {
    return this.page.getByTestId(`record-section-${key}`);
  }

  field(key: string): Locator {
    return this.page.getByTestId(`record-field-${key}`);
  }

  payNow(): Locator {
    return this.page
      .getByTestId("record-header-actions")
      .locator('[data-test-value="pay-now"]');
  }

  /** The shared payment overlay Pay now opens (the `?init=pay` intent routes here). */
  paymentOverlay(): Locator {
    return this.page.getByTestId("order-payment-overlay");
  }

  async pay(): Promise<void> {
    await this.payNow().click();
  }
}
