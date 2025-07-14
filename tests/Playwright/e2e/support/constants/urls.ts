import playwrightConfig from "../../../../../playwright.config";

const baseUrl = playwrightConfig.use?.baseURL ?? "http://localhost:5173/";

export const URLs = {
  /* GENERIC URLS */
  baseUrl,
  basket: `${baseUrl}basket`,
  emptyBasket: `${baseUrl}empty`,
  checkout: `${baseUrl}checkout`,
  login: `${baseUrl}auth/login`,
  logout: `${baseUrl}auth/logout`,
  register: `${baseUrl}auth/register`,

  /* ADD PRODUCT URLS */
  devBlocks: `${baseUrl}product/add/78985742-6489-7012-8e2b-21e325d0ed36`,
  starterHosting: `${baseUrl}product/add/3de78642-de53-9714-76df-21208469530d`,
  goldPlanHosting: `${baseUrl}product/add/5d085e69-d562-3719-4e8a-218e940d4237`,
  consultingBlock: `${baseUrl}product/add/20403869-6e54-721d-264c-518d9305e7d2`,

  paymentTerms: `${baseUrl}product/add/20403869-6e54-721d-2d7c-518d9305e7d2`,
  paymentTermsPromo: `${baseUrl}product/add/3de78642-de53-9714-745c-21208469530d`,

  comDomain: `${baseUrl}product/add/47d73824-8507-9315-778f-81e642d59e06`,
  ioDomain: `${baseUrl}product/add/3de78642-de53-9714-795b-21208469530d`,
  orgDomain: `${baseUrl}product/add/20403869-6e54-721d-287b-518d9305e7d2`,
  auDomain: `${baseUrl}product/add/78985742-6489-7012-872c-21e325d0ed36`,
  coukDomain: `${baseUrl}product/add/8d632507-9806-5d1e-dd4f-8174e234e98d`,
  cozaDomain: `${baseUrl}product/add/320e4357-95e7-8d18-0d0a-31643202d986`,
  netDomain: `${baseUrl}product/add/5952098d-3de4-0917-774c-31578626e347`,
  ukDomain: `${baseUrl}product/add/4d036794-24d0-e710-448b-3153698d582e`,

  /* PROMOTION TESTING PRODUCT URLS*/
  fixedDiscount: `${baseUrl}product/add/825d96e7-63ed-0913-752b-417482528340`,
  percentageDiscount: `${baseUrl}product/add/5d085e69-d562-3719-469c-218e940d4237`,
  usdPromo: `${baseUrl}?pid=4d036794-24d0-e710-478a-3153698d582e&currency=USD`,
  gbpPromo: `${baseUrl}product/add/4d036794-24d0-e710-458c-3153698d582e`,
  oneYearPromo: `${baseUrl}product/add/8d632507-9806-5d1e-d64b-8174e234e98d`,
  priceListPromo: `${baseUrl}product/add/47d73824-8507-9315-798b-81e642d59e06`,
  unlimitedRecurringPromo: `${baseUrl}product/add/5952098d-3de4-0917-724f-31578626e347`,
  oneTimeRecurringPromo: `${baseUrl}product/add/20403869-6e54-721d-207a-518d9305e7d2`,
  newClientPromo: `${baseUrl}product/add/3de78642-de53-9714-785a-21208469530d`,
  existingClientPromo: `${baseUrl}product/add/78985742-6489-7012-8d2f-21e325d0ed36`,
  worksWithOtherPromos: `${baseUrl}product/add/320e4357-95e7-8d18-020c-31643202d986`,
  inactivePromo: `${baseUrl}product/add/5d085e69-d562-3719-489f-218e940d4237`,
  singleUsePromo: `${baseUrl}product/add/2785d26e-9678-3d16-934b-314502e70439`,
  autoAppliedPromo: `${baseUrl}product/add/825d96e7-63ed-0913-722a-417482528340`,

  /* API URLS */
  apiUrl: "https://api.staging.upmind.io/",
  apiOrigin: `${baseUrl}`,
  apiGetToken: "oauth/access_token",
  apiGetBasket: "client/orders/current"
};
