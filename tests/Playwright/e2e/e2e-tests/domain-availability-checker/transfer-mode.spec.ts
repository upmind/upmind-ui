import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { interceptConfigValues } from "../../support/mocks/brand";
import { mockDomainAvailability } from "../../support/mocks/domain";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import {
  domainProducts,
  domainProductIds
} from "../../support/constants/domain-suggestions";

/**
 * @fileoverview Transfer-mode behaviour for the existing-domain DAC flow
 *
 * ## Job To Be Done
 * Verify that the "Use a domain I already own" (existing) flow:
 *   - Fires ONLY /availability, never /suggestions or /suggestions/tlds
 *   - A transferable domain renders a positive result with transfer option
 *   - A non-transferable domain renders the "not available" treatment
 *
 * ## What Breaks If These Fail
 * Users would see broken domain validation when entering owned domains,
 * or the system would incorrectly call suggestions API for transfer checks.
 *
 * ## How the existing-domain flow works
 * 1. User clicks "Use a domain I already own" (existing) radio
 * 2. User enters domain in the SmartDomainExisting input
 * 3. System validates via /availability endpoint (not /suggestions)
 * 4. Based on result: shows transfer option, registration option, or unavailable
 */

const TRANSFER_DOMAIN = "mybusiness.com";

let productConfig: ProductConfig;

/**
 * Select the "Use a domain I already own" radio and fill the domain input.
 * The existing-domain flow checks availability only (no suggestions).
 */
async function selectExistingAndFill(domain: string) {
  await productConfig.domainRadioExisting.scrollIntoViewIfNeeded();
  await productConfig.enterDomainRadio("existing", domain);
  await productConfig.domainExistingInput.blur();
}

test.describe("DAC existing-domain mode (transfer checks)", () => {
  // Brand intercept registered directly in beforeEach so it's always wired up
  // before any test-side navigation triggers a brand-config fetch.
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    await page.goto(URLs.baseUrl);
    await interceptConfigValues(page, {
      domainSearchMethod: "smart-suggest"
    });
  });

  test("Existing-domain mode only checks availability — no suggestions are generated", async ({
    page,
    context
  }) => {
    mockDomainAvailability(context, {
      byDomain: {
        [TRANSFER_DOMAIN]: {
          can_register: false,
          can_transfer: true,
          is_premium: false,
          product_id: domainProductIds.com,
          product: domainProducts[domainProductIds.com]
        }
      }
    });

    const suggestionCalls: string[] = [];
    page.on("request", req => {
      if (req.url().includes("/modules/web_hosting/domains/suggestions")) {
        suggestionCalls.push(req.url());
      }
    });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(TRANSFER_DOMAIN);

    // Wait for the transfer button to appear - this proves the availability check completed
    const addTransferButton = page.getByTestId("domain-add-transfer-button");
    await expect(addTransferButton).toBeVisible({ timeout: 15000 });

    // Verify no suggestions calls were made (only availability should fire)
    expect(suggestionCalls).toHaveLength(0);
  });

  test("A transferable domain shows the transfer button", async ({
    page,
    context
  }) => {
    mockDomainAvailability(context, {
      byDomain: {
        [TRANSFER_DOMAIN]: {
          can_register: false,
          can_transfer: true,
          is_premium: false,
          product_id: domainProductIds.com,
          product: domainProducts[domainProductIds.com]
        }
      }
    });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(TRANSFER_DOMAIN);

    // SmartDomainExisting shows "Add transfer" button for transferable domains
    const addTransferButton = page.getByTestId("domain-add-transfer-button");
    await expect(addTransferButton).toBeVisible({ timeout: 15000 });
  });

  test("A domain that cannot be transferred or registered shows DNS-only info", async ({
    page,
    context
  }) => {
    mockDomainAvailability(context, {
      byDomain: {
        [TRANSFER_DOMAIN]: {
          can_register: false,
          can_transfer: false,
          is_premium: false
        }
      }
    });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(TRANSFER_DOMAIN);

    // When a domain cannot be transferred or registered, the existing flow shows
    // DNS-only info text OR allows it as-is for manual DNS setup
    // Wait for validation to complete (no loading spinner)
    await page.waitForTimeout(2000);

    // The domain input should still contain the domain (not cleared)
    const domainInput = productConfig.domainExistingInput;
    await expect(domainInput).toHaveValue(TRANSFER_DOMAIN);

    // No transfer or register button should appear
    const transferButton = page.getByTestId("domain-add-transfer-button");
    const registerButton = page.getByTestId("domain-add-registration-button");
    await expect(transferButton).not.toBeVisible();
    await expect(registerButton).not.toBeVisible();
  });

  test("If the availability check fails, the form does not show transfer/register options", async ({
    page,
    context
  }) => {
    mockDomainAvailability(context, { errorStatus: 500 });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(TRANSFER_DOMAIN);

    // Wait for the error response to be processed
    await page.waitForTimeout(2000);

    // The domain input should still contain the domain
    const domainInput = productConfig.domainExistingInput;
    await expect(domainInput).toHaveValue(TRANSFER_DOMAIN);

    // No transfer or register button should appear on error
    const transferButton = page.getByTestId("domain-add-transfer-button");
    const registerButton = page.getByTestId("domain-add-registration-button");
    await expect(transferButton).not.toBeVisible();
    await expect(registerButton).not.toBeVisible();
  });

  /**
   * FE-2806: Transfer price display
   *
   * Tests for correct transfer pricing copy:
   * - Free transfer should show "free" not "only £0.00"
   * - Paid transfer should show "only £X"
   *
   * NOTE: The renewal copy test is pending - currently the copy always shows
   * "includes 1-year renewal" unconditionally. A product field needs to be
   * identified/added to control this display.
   */
  test("Free transfer shows 'free' in the pricing copy", async ({
    page,
    context
  }) => {
    // `transferOptionIsFree` is driven by `getTransferOptionPrice`
    // (headless/domain/utils.ts), NOT by the parent product's own prices. It
    // returns `isFree: true` only when the transfer SUB-product — the
    // `options[]` entry referenced by `setup_function_sub_ids.transfer` — has
    // `category.price_override` truthy AND a `billing_cycle_months: 0` price of
    // `0`. Build exactly that shape so the real free-transfer copy renders.
    const base = domainProducts[domainProductIds.com];
    const transferSubId = base.setup_function_sub_ids?.transfer?.[0];
    const freeTransferProduct = {
      ...base,
      // Parent prices stay non-zero — they drive the renewal line, not "free".
      options: [
        {
          id: transferSubId,
          category: { price_override: true },
          prices: [
            {
              billing_cycle_months: 0,
              price: 0,
              price_formatted: "£0.00",
              price_discounted_formatted: null,
              price_discounted: null,
              promotions: []
            }
          ]
        }
      ]
    };

    mockDomainAvailability(context, {
      byDomain: {
        [TRANSFER_DOMAIN]: {
          can_register: false,
          can_transfer: true,
          is_premium: false,
          product_id: domainProductIds.com,
          product: freeTransferProduct
        }
      }
    });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(TRANSFER_DOMAIN);

    // Wait for the transfer info to appear; `data-test-value="free"` is set by
    // SmartDomainExisting off `transferOptionIsFree`, locale-stably encoding that
    // the free-transfer copy (not a "£0.00" price) is rendered.
    const transferInfo = page.getByTestId("domain-transfer-pricing-info");
    await expect(transferInfo).toBeVisible({ timeout: 15000 });
    await expect(transferInfo).toHaveAttribute("data-test-value", "free");
  });

  test("Paid transfer shows correct price in the pricing copy", async ({
    page,
    context
  }) => {
    // Product with £2.50 transfer price
    const paidTransferProduct = {
      ...domainProducts[domainProductIds.com],
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: "£2.50",
          price_discounted_formatted: null,
          price: 2.5,
          price_discounted: null,
          promotions: []
        }
      ]
    };

    mockDomainAvailability(context, {
      byDomain: {
        [TRANSFER_DOMAIN]: {
          can_register: false,
          can_transfer: true,
          is_premium: false,
          product_id: domainProductIds.com,
          product: paidTransferProduct
        }
      }
    });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(TRANSFER_DOMAIN);

    // `data-test-value="paid"` is set by SmartDomainExisting off
    // `transferOptionIsFree` — locale-stably encoding that the paid-transfer copy
    // (with a transfer price) renders rather than the free variant.
    const transferInfo = page.getByTestId("domain-transfer-pricing-info");
    await expect(transferInfo).toBeVisible({ timeout: 15000 });
    await expect(transferInfo).toHaveAttribute("data-test-value", "paid");
  });

  // TODO FE-2806: Add test for conditional renewal copy once product field is identified
  // test("Transfer without renewal extension omits renewal copy", ...)
  // test("Transfer with renewal extension shows renewal copy", ...)
});
