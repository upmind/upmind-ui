import { URLs } from "./Urls";

/* 
Pricing values, for reference:
    INHERIT_FROM_BRAND = 0,
    LOWEST_PRICE = 1,
    LOWEST_MONTHLY_PRICE = 2,
    HIGHEST_PRICE = 3,
*/

export const DefaultPaymentTerms = [
  {
    name: "Default Payment Term - Inherit from Brand",
    termSetting: 0,
    radioGroup: 0,
    radioOption: 0,
    url: `${URLs.paymentTerms}`
  },
  {
    name: "Default Payment Term - Lowest Price",
    termSetting: 1,
    radioGroup: 0,
    radioOption: 0,
    url: `${URLs.paymentTerms}`
  },
  {
    name: "Default Payment Term - Lowest Monthly Price",
    termSetting: 2,
    radioGroup: 0,
    radioOption: 2,
    url: `${URLs.paymentTerms}`
  },
  {
    name: "Default Payment Term - Highest Price",
    termSetting: 3,
    radioGroup: 0,
    radioOption: 2,
    url: `${URLs.paymentTerms}`
  }
];

export const DefaultPaymentTermsWithPromo = [
  {
    name: "Default Payment Term - Inherit from Brand - Promotion Applied",
    termSetting: 0,
    radioGroup: 0,
    radioOption: 0,
    url: `${URLs.paymentTermsPromo}`
  },
  {
    name: "Default Payment Term - Lowest Price - Promotion Applied",
    termSetting: 1,
    radioGroup: 0,
    radioOption: 0,
    url: `${URLs.paymentTermsPromo}`
  },
  {
    name: "Default Payment Term - Lowest Monthly Price - Promotion Applied",
    termSetting: 2,
    radioGroup: 0,
    radioOption: 2,
    url: `${URLs.paymentTermsPromo}`
  },
  {
    name: "Default Payment Term - Highest Price - Promotion Applied",
    termSetting: 3,
    radioGroup: 0,
    radioOption: 1,
    url: `${URLs.paymentTermsPromo}`
  }
];
