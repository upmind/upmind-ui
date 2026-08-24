import { URLs } from "./urls";

/*
Pricing values, for reference:
    INHERIT_FROM_BRAND = 0,
    LOWEST_PRICE = 1,
    LOWEST_MONTHLY_PRICE = 2,
    HIGHEST_PRICE = 3,
*/

// `radioCycle` is the term's stable billing-cycle in months (Monthly = 1,
// Annually = 12, Biennially = 24) — the locale-safe `option-tile-${cycle}`
// cascade key, NOT the translated term label.
export const DefaultPaymentTerms = [
  {
    name: "Default Payment Term - Inherit from Brand",
    termSetting: 0,
    radioCycle: 1,
    url: `${URLs.paymentTerms}`
  },
  {
    name: "Default Payment Term - Lowest Price",
    termSetting: 1,
    radioCycle: 1,
    url: `${URLs.paymentTerms}`
  },
  {
    name: "Default Payment Term - Lowest Monthly Price",
    termSetting: 2,
    radioCycle: 24,
    url: `${URLs.paymentTerms}`
  },
  {
    name: "Default Payment Term - Highest Price",
    termSetting: 3,
    radioCycle: 24,
    url: `${URLs.paymentTerms}`
  }
];

export const DefaultPaymentTermsWithPromo = [
  {
    name: "Default Payment Term - Inherit from Brand - Promotion Applied",
    termSetting: 0,
    radioCycle: 1,
    url: `${URLs.paymentTermsPromo}`
  },
  {
    name: "Default Payment Term - Lowest Price - Promotion Applied",
    termSetting: 1,
    radioCycle: 1,
    url: `${URLs.paymentTermsPromo}`
  },
  {
    name: "Default Payment Term - Lowest Monthly Price - Promotion Applied",
    termSetting: 2,
    radioCycle: 24,
    url: `${URLs.paymentTermsPromo}`
  },
  {
    name: "Default Payment Term - Highest Price - Promotion Applied",
    termSetting: 3,
    radioCycle: 12,
    url: `${URLs.paymentTermsPromo}`
  }
];
