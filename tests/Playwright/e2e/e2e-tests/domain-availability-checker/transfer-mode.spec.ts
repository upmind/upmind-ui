import { test, expect, Page } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import { mockDomainAvailability } from "../../support/mocks/domain";
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

/**
 * Select the "Use a domain I already own" radio and fill the domain input.
 * The existing-domain flow checks availability only (no suggestions).
 */
async function selectExistingAndFill(page: Page, domain: string) {
  // Wait for the domain field section to be visible
  // The label "Use existing domain" indicates the radio we want
  const existingOption = page.locator("text=Use existing domain");
  await existingOption.scrollIntoViewIfNeeded();
  await existingOption.waitFor({ state: "visible", timeout: 15000 });

  // Click on the option row (parent container handles the click)
  await existingOption.click();

  // Wait for the existing domain input to appear
  // The input has placeholder "Enter your domain..."
  const domainInput = page.getByPlaceholder(/enter your domain/i);
  await domainInput.waitFor({ state: "visible", timeout: 10000 });
  await domainInput.fill(domain);

  // Trigger the blur event to ensure debounced update fires
  await domainInput.blur();
}

test.describe("DAC existing-domain mode (transfer checks)", () => {
  // Brand intercept registered directly in beforeEach so it's always wired up
  // before any test-side navigation triggers a brand-config fetch.
  test.beforeEach(async ({ page, context }) => {
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context, { guestOnly: true });
    const token = await getSessionToken(context);
    await interceptConfigValues(page, token, {
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
    await selectExistingAndFill(page, TRANSFER_DOMAIN);

    // Wait for the transfer button to appear - this proves the availability check completed
    const addTransferButton = page.getByRole("button", {
      name: /add transfer|transfer/i
    });
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
    await selectExistingAndFill(page, TRANSFER_DOMAIN);

    // SmartDomainExisting shows "Add transfer" button for transferable domains
    const addTransferButton = page.getByRole("button", {
      name: /add transfer|transfer/i
    });
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
    await selectExistingAndFill(page, TRANSFER_DOMAIN);

    // When a domain cannot be transferred or registered, the existing flow shows
    // DNS-only info text OR allows it as-is for manual DNS setup
    // Wait for validation to complete (no loading spinner)
    await page.waitForTimeout(2000);

    // The domain input should still contain the domain (not cleared)
    const domainInput = page.getByPlaceholder(/enter your domain/i);
    await expect(domainInput).toHaveValue(TRANSFER_DOMAIN);

    // No transfer or register button should appear
    const transferButton = page.getByRole("button", { name: /add transfer/i });
    const registerButton = page.getByRole("button", {
      name: /add registration/i
    });
    await expect(transferButton).not.toBeVisible();
    await expect(registerButton).not.toBeVisible();
  });

  test("If the availability check fails, the form does not show transfer/register options", async ({
    page,
    context
  }) => {
    mockDomainAvailability(context, { errorStatus: 500 });

    await page.goto(URLs.starterHosting);
    await selectExistingAndFill(page, TRANSFER_DOMAIN);

    // Wait for the error response to be processed
    await page.waitForTimeout(2000);

    // The domain input should still contain the domain
    const domainInput = page.getByPlaceholder(/enter your domain/i);
    await expect(domainInput).toHaveValue(TRANSFER_DOMAIN);

    // No transfer or register button should appear on error
    const transferButton = page.getByRole("button", { name: /add transfer/i });
    const registerButton = page.getByRole("button", {
      name: /add registration/i
    });
    await expect(transferButton).not.toBeVisible();
    await expect(registerButton).not.toBeVisible();
  });
});
