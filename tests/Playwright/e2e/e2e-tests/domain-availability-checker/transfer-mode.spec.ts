import { test, expect } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Dac } from "../../support/page-objects/templates/dac";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import {
  mockDomainSuggestions,
  mockDomainSuggestionsTlds,
  mockDomainAvailability
} from "../../support/mocks/domain";
import {
  domainProducts,
  domainProductIds
} from "../../support/constants/domain-suggestions";

/**
 * Transfer-mode behaviour for the smart-suggest DAC flow:
 *   - Transfer fires ONLY /availability, never /suggestions or /suggestions/tlds.
 *   - A transferable domain renders a positive result.
 *   - A non-transferable domain renders the "not available" treatment.
 *   - Switching register → transfer must not leak register-flow calls.
 *
 * Transfer mode is engaged via the "Transfer a domain" accordion on a product
 * config page (e.g. `URLs.starterHosting`), not on the standalone /domains/ page.
 */

const TRANSFER_DOMAIN = "mybusiness.com";

async function fillTransferAccordion(
  productConfig: ProductConfig,
  domain: string
) {
  await productConfig.domainTransfer.click();
  await productConfig.domainTransfer
    .getByTestId("accordion-content")
    .locator("input")
    .fill(domain);
}
test.describe.configure({ mode: "parallel" });
test.describe("DAC transfer mode", () => {
  let productConfig: ProductConfig;
  let dac: Dac;

  // Brand intercept registered directly in beforeEach so it's always wired up
  // before any test-side navigation triggers a brand-config fetch.
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    dac = new Dac(page);
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context, { guestOnly: true });
    const token = await getSessionToken(context);
    await interceptConfigValues(page, token, {
      domainSearchMethod: "smart-suggest"
    });
  });

  test("Switching to Transfer mode only checks the typed domain — no suggestions are generated", async ({
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

    const registerFlowCalls: string[] = [];
    page.on("request", req => {
      if (req.url().includes("/modules/web_hosting/domains/suggestions")) {
        registerFlowCalls.push(req.url());
      }
    });
    const availabilityResponse = page.waitForResponse(res =>
      res
        .url()
        .includes(
          `/modules/web_hosting/domains/availability/${TRANSFER_DOMAIN}`
        )
    );

    await page.goto(URLs.starterHosting);
    await fillTransferAccordion(productConfig, TRANSFER_DOMAIN);
    await availabilityResponse;

    expect(registerFlowCalls).toHaveLength(0);
  });

  test("A transferable domain shows up as a transfer result", async ({
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
    await fillTransferAccordion(productConfig, TRANSFER_DOMAIN);

    await expect(dac.firstCard).toBeVisible({ timeout: 15000 });
    await expect(dac.firstCard).toContainText(TRANSFER_DOMAIN);
    await expect(dac.firstCard).not.toContainText(
      /available for registration/i
    );
  });

  test("A domain that can't be transferred is shown as unavailable", async ({
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
    await fillTransferAccordion(productConfig, TRANSFER_DOMAIN);

    await expect(dac.results).toContainText(
      /This domain is not available through us./i,
      { timeout: 15000 }
    );
  });

  test("If the availability check fails, the typed domain shows as unavailable rather than getting stuck loading", async ({
    page,
    context
  }) => {
    mockDomainAvailability(context, { errorStatus: 500 });

    await page.goto(URLs.starterHosting);
    await fillTransferAccordion(productConfig, TRANSFER_DOMAIN);

    await expect(dac.results).toContainText(
      /This domain is not available through us./i,
      { timeout: 15000 }
    );
  });
});
