[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BrandConfigKeys

# BrandConfigKeys

Enum representing the various configuration keys available for branding settings.
These keys are used to configure and manage various aspects of the brand system,
including invoicing, billing, UI settings, analytics, and more.

## Enumeration Members

### ACCOUNTING_REVENUE_RECOGNITION

```ts
ACCOUNTING_REVENUE_RECOGNITION: "invoices.common.accounting_revenue_recognition";
```

Key to enable accounting revenue recognition settings for invoices.

---

### AFFILIATES_DEFAULT_REDIRECT_LINK

```ts
AFFILIATES_DEFAULT_REDIRECT_LINK: "affiliate_systems.settings.default_redirect";
```

Default redirect link for affiliate systems.

---

### ALLOWED_UPLOAD_FILE_TYPES

```ts
ALLOWED_UPLOAD_FILE_TYPES: "security.uploads.allowed_upload_file_types";
```

Allowed file types for uploads, defined for security purposes.

---

### ANALYTICS_GA_MEASUREMENT_ID

```ts
ANALYTICS_GA_MEASUREMENT_ID: "analytics.google.measurement_id";
```

Google Analytics Measurement ID for tracking purposes.

---

### ANALYTICS_GTM_CONTAINER_ID

```ts
ANALYTICS_GTM_CONTAINER_ID: "analytics.gtm.container_id";
```

Google Tag Manager Container ID for managing tags.

---

### BASKET_DEFAULT_CURRENCY

```ts
BASKET_DEFAULT_CURRENCY: "ui.basket.default_currency";
```

Default currency used in the shopping basket.

---

### BILLING_GATEWAY_FORCE_AUTO_PAYMENT

```ts
BILLING_GATEWAY_FORCE_AUTO_PAYMENT: "billing.gateway.force_auto_payment_for_stored_details";
```

Enforces automatic payment for stored details at the billing gateway.

---

### BILLING_GATEWAY_FORCE_CARD_STORAGE

```ts
BILLING_GATEWAY_FORCE_CARD_STORAGE: "billing.gateway.force_card_storage";
```

Forces the storage of card details during the checkout process.

---

### BILLING_TERM_DISPLAY

```ts
BILLING_TERM_DISPLAY: "ui.basket.billing_term_display";
```

Configuration for how billing terms are displayed in the basket.

---

### CHECKOUT_FLOW

```ts
CHECKOUT_FLOW: "ui.checkout.checkout_flow";
```

Defines the overall flow of the checkout process.

---

### CHECKOUT_HIDE_DISCOUNT_CODE_FIELD

```ts
CHECKOUT_HIDE_DISCOUNT_CODE_FIELD: "ui.checkout.hide_promotions_field";
```

Hides the discount code field in the checkout process.

---

### CHECKOUT_SUMMARY_COLOR_STOP1

```ts
CHECKOUT_SUMMARY_COLOR_STOP1: "ui.checkout.checkout_summary_color_stop1";
```

The first stop in the gradient for the checkout summary's background color.

---

### CHECKOUT_SUMMARY_COLOR_STOP2

```ts
CHECKOUT_SUMMARY_COLOR_STOP2: "ui.checkout.checkout_summary_color_stop2";
```

The second stop in the gradient for the checkout summary's background color.

---

### CHECKOUT_SUMMARY_CONTRAST_MODE

```ts
CHECKOUT_SUMMARY_CONTRAST_MODE: "ui.checkout.checkout_summary_contrast_mode";
```

Enables contrast mode for the checkout summary.

---

### CLIENT_NOTES_AND_SECRETS_ENABLED

```ts
CLIENT_NOTES_AND_SECRETS_ENABLED: "ui.client_area.allow_vault";
```

Enables clients to add notes and secrets to their accounts.

---

### DEFAULT_CLIENT_HOMEPAGE

```ts
DEFAULT_CLIENT_HOMEPAGE: "ui.client_area.homepage";
```

Default homepage for clients after they log in.

---

### DISABLE_CLIENT_REGISTRATION

```ts
DISABLE_CLIENT_REGISTRATION: "ui.client_area.hide_registration_forms";
```

Disables client registration forms.

---

### GUEST_CHECKOUT_ENABLED

```ts
GUEST_CHECKOUT_ENABLED: "invoices.guest_checkout.enabled";
```

Enables guest checkout for invoices.

---

### INVOICE_CONSOLIDATION_BASE_RULE

```ts
INVOICE_CONSOLIDATION_BASE_RULE: "invoices.consolidation.base_rule";
```

Base rule for invoice consolidation.

---

### INVOICE_CONSOLIDATION_DATE

```ts
INVOICE_CONSOLIDATION_DATE: "invoices.consolidation.base_rule_date_of_month_day";
```

Date rule for invoice consolidation, set by day of the month.

---

### INVOICE_CONSOLIDATION_ENABLED

```ts
INVOICE_CONSOLIDATION_ENABLED: "invoices.consolidation.enabled";
```

Enables the invoice consolidation feature.

---

### INVOICE_CONSOLIDATION_WEEK_DAY

```ts
INVOICE_CONSOLIDATION_WEEK_DAY: "invoices.consolidation.base_rule_day_of_week";
```

Weekday rule for invoice consolidation.

---

### INVOICE_CREDIT_NOTE_NUMBER_SEPARATE

```ts
INVOICE_CREDIT_NOTE_NUMBER_SEPARATE: "invoices.common.credit_note_number_separate_sequence";
```

Enables a separate sequence for credit note numbers.

---

### PARTIAL_PAYMENTS_ENABLED

```ts
PARTIAL_PAYMENTS_ENABLED: "billing.gateway.client_allow_partial_payments";
```

Allows partial payments for clients at the billing gateway.

---

### PAY_LATER_ENABLED

```ts
PAY_LATER_ENABLED: "invoices.common.is_available_pay_later";
```

Enables the "Pay Later" option for invoices.

---

### PREVENT_CARD_REMOVAL_IF_LAST

```ts
PREVENT_CARD_REMOVAL_IF_LAST: "billing.gateway.allow_card_removal_replacement";
```

Prevents card removal if it's the last saved payment method for a client.

---

### PRICE_DISPLAY_TYPE

```ts
PRICE_DISPLAY_TYPE: "invoices.common.display_price_type";
```

Controls how prices are displayed on invoices.

---

### PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD

```ts
PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD: "invoices.common.default_payment_period";
```

Sets the default payment period for invoices.

---

### REQUIRE_ADDRESS_FOR_ORDERS

```ts
REQUIRE_ADDRESS_FOR_ORDERS: "invoices.common.require_address_for_orders";
```

Requires an address for placing orders.

---

### REQUIRE_PHONE_ON_REGISTRATION

```ts
REQUIRE_PHONE_ON_REGISTRATION: "ui.client_registration.require_phone";
```

Requires a phone number during client registration.

---

### REQUIRE_REGION_IN_ADDRESS

```ts
REQUIRE_REGION_IN_ADDRESS: "invoices.common.required_region_in_address";
```

Requires a region to be specified in addresses for invoices.

---

### SHOP_TRUNCATE_DESCRIPTIONS

```ts
SHOP_TRUNCATE_DESCRIPTIONS: "ui.basket.truncate_product_description";
```

Truncates long product descriptions in the shop interface.

---

### SHOW_CLIENT_STORE

```ts
SHOW_CLIENT_STORE: "ui.client_area.show_catalog";
```

Displays the client store in the client area.

---

### SHOW_PROMOTION_AS

```ts
SHOW_PROMOTION_AS: "invoices.common.show_promotion_as";
```

Defines how promotions are displayed in the catalogue.

---

### SHOW_PROMOTIONS_ON_CATALOGUE

```ts
SHOW_PROMOTIONS_ON_CATALOG: "invoices.common.show_promotions_on_catalog";
```

Displays promotions in the catalogue.

---

### SUBSCRIPTIONS_CANCEL_INTERVAL

```ts
SUBSCRIPTIONS_CANCEL_INTERVAL: "subscriptions.contract.invoice_contract_cancel_interval";
```

Interval for canceling subscription contracts.

---

### SUBSCRIPTIONS_CLOSE_INTERVAL

```ts
SUBSCRIPTIONS_CLOSE_INTERVAL: "subscriptions.contract.invoice_contract_close_interval";
```

Interval for closing subscription contracts.

---

### SUBSCRIPTIONS_MONEY_BACK_PERIOD

```ts
SUBSCRIPTIONS_MONEY_BACK_PERIOD: "subscriptions.contract.product_recommended_money_back_period";
```

Recommended money-back period for subscription contracts.

---

### SUBSCRIPTIONS_SUSPEND_INTERVAL

```ts
SUBSCRIPTIONS_SUSPEND_INTERVAL: "subscriptions.contract.invoice_contract_suspend_interval";
```

Interval for suspending subscription contracts.

---

### SUPPORT_PIN_ENABLED

```ts
SUPPORT_PIN_ENABLED: "tickets.support.support_pin_enabled";
```

Enables support PIN for client authentication.

---

### UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM

```ts
UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM: "ui.client_area.disable_support_system";
```

Disables the support system in the client app.

---

### UI_CLIENT_APP_PAGE_AFTER_LOGIN

```ts
UI_CLIENT_APP_PAGE_AFTER_LOGIN: "ui.client_area.page_after_login";
```

Defines the page clients see after logging in.

---

### UI_CLIENT_APP_PAYMENT_TERM_DESCRIPTIONS

```ts
UI_CLIENT_APP_PAYMENT_TERM_DESCRIPTIONS: "ui.client_area.payment_term_descriptions";
```

Describes payment terms in the client app.

---

### UI_ENTER_KEY_ACTION

```ts
UI_ENTER_KEY_ACTION: "ui.client_area.enter_key_action";
```

Defines the action taken when pressing the Enter key in forms.

---

### UI_PRICE_BEFORE_DISCOUNT_POSITION

```ts
UI_PRICE_BEFORE_DISCOUNT_POSITION: "ui.client_area.price_before_discount_position";
```

Displays the price before discount in the client app.

---

### UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED

```ts
UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED: "affiliate_systems.upmind.customer_controls_enabled";
```

Enables customer control features in the Upmind affiliates system.

---

### UPMIND_AFFILIATES_ENABLED

```ts
UPMIND_AFFILIATES_ENABLED: "affiliate_systems.upmind.enabled";
```

Enables the Upmind affiliates system.
