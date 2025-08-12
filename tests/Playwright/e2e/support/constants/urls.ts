import playwrightConfig from "../../../../../playwright.config";

const baseUrl = playwrightConfig.use?.baseURL ?? "http://localhost:5173/";

export const URLs = {
  /* GENERIC URLS */
  baseUrl,
  basket: `${baseUrl}order/basket`,
  emptyBasket: `${baseUrl}order/empty`,
  checkout: `${baseUrl}order/checkout`,
  login: `${baseUrl}order/auth/login`,
  logout: `${baseUrl}order/auth/logout`,
  register: `${baseUrl}order/auth/register`,

  /* ADD PRODUCT URLS */
  devBlocks: `${baseUrl}order/product/add/78985742-6489-7012-8e2b-21e325d0ed36`,
  starterHosting: `${baseUrl}order/product/add/3de78642-de53-9714-76df-21208469530d`,
  goldPlanHosting: `${baseUrl}order/product/add/5d085e69-d562-3719-4e8a-218e940d4237`,
  consultingBlock: `${baseUrl}order/product/add/20403869-6e54-721d-264c-518d9305e7d2`,

  paymentTerms: `${baseUrl}order/product/add/20403869-6e54-721d-2d7c-518d9305e7d2`,
  paymentTermsPromo: `${baseUrl}order/product/add/3de78642-de53-9714-745c-21208469530d`,

  comDomain: `${baseUrl}order/product/add/825d96e7-63ed-0913-792c-417482528340`,
  ukDomain: `${baseUrl}order/product/add/320e4357-95e7-8d18-050b-31643202d986`,

  managementTraining: `${baseUrl}order/product/add/20403869-6e54-721d-2e7c-518d9305e7d2`,

  /* PROMOTION TESTING PRODUCT URLS*/
  fixedDiscount: `${baseUrl}order/product/add/825d96e7-63ed-0913-752b-417482528340`,
  percentageDiscount: `${baseUrl}order/product/add/5d085e69-d562-3719-469c-218e940d4237`,
  usdPromo: `${baseUrl}?pid=4d036794-24d0-e710-478a-3153698d582e&currency=USD`,
  gbpPromo: `${baseUrl}order/product/add/4d036794-24d0-e710-458c-3153698d582e`,
  oneYearPromo: `${baseUrl}order/product/add/8d632507-9806-5d1e-d64b-8174e234e98d`,
  priceListPromo: `${baseUrl}order/product/add/47d73824-8507-9315-798b-81e642d59e06`,
  unlimitedRecurringPromo: `${baseUrl}order/product/add/5952098d-3de4-0917-724f-31578626e347`,
  oneTimeRecurringPromo: `${baseUrl}order/product/add/20403869-6e54-721d-207a-518d9305e7d2`,
  newClientPromo: `${baseUrl}order/product/add/3de78642-de53-9714-785a-21208469530d`,
  existingClientPromo: `${baseUrl}order/product/add/78985742-6489-7012-8d2f-21e325d0ed36`,
  worksWithOtherPromos: `${baseUrl}order/product/add/320e4357-95e7-8d18-020c-31643202d986`,
  inactivePromo: `${baseUrl}order/product/add/5d085e69-d562-3719-489f-218e940d4237`,
  singleUsePromo: `${baseUrl}order/product/add/2785d26e-9678-3d16-934b-314502e70439`,
  autoAppliedPromo: `${baseUrl}order/product/add/825d96e7-63ed-0913-722a-417482528340`,

  /* API URLS */
  apiUrl: "https://api.staging.upmind.io/",
  apiOrigin: `${baseUrl}`,
  apiGetToken: "oauth/access_token",
  apiGetBasket: "client/orders/current"
};
