/**
 * Canonical staging country ids.
 *
 * Setup values for driving the address country/region controls — never
 * asserted as literals (assertions read locale-safe selection state and
 * option keys, per the FE-2840 locale trap). Both UK and US are known to
 * expose their own region lists, and because region ids are country-scoped
 * the two region sets are mutually disjoint — which the FE-2789 country→region
 * cascade spec relies on to prove the region list re-derives on a country
 * change.
 *
 * Sourced from the `GET /countries` staging recording
 * (workshop-bundle/07-references/recordings/get-countries.json) and
 * corroborated by the `country_id` used in the payment module foundation doc.
 */
export const Countries = {
  UK: "320e4357-95e7-8d18-484f-31643202d986",
  US: "2785d26e-9678-3d16-75ec-314502e70439"
} as const;
