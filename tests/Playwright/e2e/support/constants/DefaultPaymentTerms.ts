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
    radioOption: 2,
  },
  {
    name: "Default Payment Term - Lowest Price",
    termSetting: 1,
    radioGroup: 0,
    radioOption: 0,
  },
  {
    name: "Default Payment Term - Lowest Monthly Price",
    termSetting: 2,
    radioGroup: 0,
    radioOption: 2,
  },
  {
    name: "Default Payment Term - Highest Price",
    termSetting: 3,
    radioGroup: 0,
    radioOption: 2,
  },
];

export const DefaultPaymentTermsWithPromo = [
  {
    name: "Default Payment Term - Inherit from Brand - Promotion Applied",
    termSetting: 0,
    radioGroup: 0,
    radioOption: 1,
  },
  {
    name: "Default Payment Term - Lowest Price - Promotion Applied",
    termSetting: 1,
    radioGroup: 0,
    radioOption: 2,
  },
  {
    name: "Default Payment Term - Lowest Monthly Price - Promotion Applied",
    termSetting: 2,
    radioGroup: 0,
    radioOption: 2,
  },
  {
    name: "Default Payment Term - Highest Price - Promotion Applied",
    termSetting: 3,
    radioGroup: 0,
    radioOption: 1,
  },
];
