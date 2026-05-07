import type {
  DomainSuggestionProduct,
  DomainSuggestionRow
} from "../mocks/domain";

/**
 * Canned suggestion rows + matching products for the smart-suggest DAC flow
 * tests. IDs are stable so a test can pin a specific row → product pairing
 * without fishing through the response.
 */

export const domainProductIds = {
  com: "825d96e7-63ed-0913-792c-417482528340",
  net: "11111111-1111-1111-1111-111111111101",
  au: "4d036794-24d0-e710-488b-3153698d582e",
  io: "8d632507-9806-5d1e-d04f-8174e234e98d",
  uk: "320e4357-95e7-8d18-050b-31643202d986"
};

const baseProduct = (id: string): DomainSuggestionProduct => ({
  id,
  sub_product_id: `sub-${id}`,
  setup_function_sub_ids: { register: [`sub-${id}`], transfer: [`sub-${id}`] },
  prices: [
    {
      billing_cycle_months: 12,
      price_formatted: "£12.00",
      price_discounted_formatted: null,
      price: 12,
      price_discounted: null,
      promotions: []
    },
    {
      billing_cycle_months: 24,
      price_formatted: "£22.00",
      price_discounted_formatted: null,
      price: 22,
      price_discounted: null,
      promotions: []
    }
  ],
  products_options: [],
  products_attributes: []
});

export const domainProducts: Record<string, DomainSuggestionProduct> = {
  [domainProductIds.com]: baseProduct(domainProductIds.com),
  [domainProductIds.net]: baseProduct(domainProductIds.net),
  [domainProductIds.au]: baseProduct(domainProductIds.au),
  [domainProductIds.io]: baseProduct(domainProductIds.io),
  [domainProductIds.uk]: baseProduct(domainProductIds.uk)
};

export const suggestionRow = (
  sld: string,
  tld: string,
  productId: string,
  overrides: Partial<DomainSuggestionRow> = {}
): DomainSuggestionRow => ({
  domain: `${sld}${tld}`,
  sld,
  tld,
  can_register: true,
  can_transfer: false,
  product_id: productId,
  ...overrides
});

/** One row per TLD in `domainProductIds` — happy-path baseline. */
export const baselineSuggestionRows = (
  sld: string = "mybusiness"
): DomainSuggestionRow[] => [
  suggestionRow(sld, ".com", domainProductIds.com),
  suggestionRow(sld, ".net", domainProductIds.net),
  suggestionRow(sld, ".au", domainProductIds.au),
  suggestionRow(sld, ".io", domainProductIds.io),
  suggestionRow(sld, ".uk", domainProductIds.uk)
];
