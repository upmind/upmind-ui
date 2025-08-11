import { Page, Route, Request } from "@playwright/test";
import { URLs } from "../../constants/urls";

interface ConfigOverrides {
  requireAddressForOrders: boolean;
  requireCompanyForOrders: boolean;
  requireRegionInAddress: boolean;
  requirePhoneForOrders: boolean;
}

export async function interceptConfigValues(
  page: Page,
  bearerToken: string,
  overrides: ConfigOverrides
) {
  await page.route(
    "**/api/config/brand/values?keys=analytics.google.measurement_id%2Canalytics.gtm.container_id%2Cui.basket.default_currency%2Cui.basket.payment_term_descriptions%2Cbilling.gateway.force_auto_payment_for_stored_details%2Cbilling.gateway.force_card_storage%2Cui.checkout.checkout_flow%2Cui.checkout.hide_promotions_field%2Cinvoices.common.require_phone_for_orders%2Cui.checkout.checkout_summary_color_stop1%2Cui.checkout.checkout_summary_color_stop2%2Cui.checkout.checkout_summary_contrast_mode%2Csecurity.ui.allow_vault%2Cui.client_area.homepage%2Cinvoices.common.default_payment_period%2Cui.client_area.hide_registration_forms%2Cbilling.gateway.client_allow_partial_payments%2Cinvoices.common.is_available_pay_later%2Cbilling.gateway.allow_card_removal_replacement%2Cinvoices.common.require_address_for_orders%2Cinvoices.common.require_company_for_orders%2Cui.client_registration.require_phone%2Cinvoices.common.required_region_in_address%2Cui.basket.truncate_product_description%2Cui.client_area.show_catalog%2Cinvoices.common.show_promotion_as%2Ctickets.support.support_pin_enabled%2Cui.client_area.disable_support_system%2Cui.client_area.page_after_login%2Cui.client_area.enter_key_action%2Cui.client_area.price_before_discount_position&lang=**",
    async (route: Route, request: Request) => {
      const originalHeaders = request.headers();
      const modifiedHeaders = {
        ...originalHeaders,
        authorization: `Bearer ${bearerToken}`
      };
      const response = await page.request.fetch(request, {
        headers: modifiedHeaders
      });
      const json = await response.json();
      console.log("Original Config:", JSON.stringify(json, null, 2));
      json.data["invoices.common.require_address_for_orders"] =
        overrides.requireAddressForOrders;
      json.data["invoices.common.require_company_for_orders"] =
        overrides.requireCompanyForOrders;
      json.data["invoices.common.required_region_in_address"] =
        overrides.requireRegionInAddress;
      json.data["invoices.common.require_phone_for_orders"] =
        overrides.requirePhoneForOrders;
      const updatedResponseBody = {
        ...json
      };
      console.log(
        "Updated Config:",
        JSON.stringify(updatedResponseBody, null, 2)
      );
      route.fulfill({
        status: response.status(),
        contentType: "application/json",
        headers: response.headers(),
        body: JSON.stringify(updatedResponseBody)
      });
    }
  );
}
