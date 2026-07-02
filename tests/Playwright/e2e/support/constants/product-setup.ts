/**
 * Provision-field selector keys for `products.DOMAIN_2`. The Setup form uses
 * `data-test-key="form-item-provision-fields-update-{key}"` — these are the
 * `{key}` values used to assert which fields render. Replace the list to
 * match the actual blueprint of DOMAIN_2.
 */
export const InvalidProductFieldKeys = [
  "registrant-name",
  "registrant-email",
  "registrant-address-1",
  "registrant-address-city",
  "registrant-address-postcode",
  "registrant-address-country-code"
];

/**
 * Name of a deferred (`defer_mode: optional` or `hidden`) provision field on
 * `products.SERVER_B`. Used by the deferred-mode tests to pre-populate the
 * field via API and verify the product no longer routes through the setup page.
 */
export const DeferredFieldName = "Hostname";
