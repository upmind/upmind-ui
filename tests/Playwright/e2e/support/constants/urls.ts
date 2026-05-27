import playwrightConfig from "../../../../../playwright.config";

const baseUrl = playwrightConfig.use?.baseURL ?? "http://localhost:5173/";

export const URLs = {
  /* GENERIC URLS */
  baseUrl,
  basket: `${baseUrl}order/basket/`,
  emptyBasket: `${baseUrl}order/basket/empty/`,
  checkout: `${baseUrl}order/checkout/`,
  billing: `${baseUrl}order/basket/billing/`,
  login: `${baseUrl}order/auth/login/`,
  logout: `${baseUrl}order/auth/logout/`,
  register: `${baseUrl}order/auth/register/`,
  forgottenPassword: `${baseUrl}order/auth/recover/`,
  domainSearch: `${baseUrl}domains/`,
  domainWidget: `${baseUrl}order/shop?catid=8d632507-9806-5d1e-302f-8174e234e98d`,

  /* ADD PRODUCT URLS */
  devBlocks: `${baseUrl}order/product/78985742-6489-7012-8e2b-21e325d0ed36/`,
  starterHosting: `${baseUrl}order/product/3de78642-de53-9714-76df-21208469530d/`,
  goldPlanHosting: `${baseUrl}order/product/5d085e69-d562-3719-4e8a-218e940d4237/`,
  consultingBlock: `${baseUrl}order/product/20403869-6e54-721d-264c-518d9305e7d2/`,
  paymentTerms: `${baseUrl}order/product/20403869-6e54-721d-2d7c-518d9305e7d2/`,
  paymentTermsPromo: `${baseUrl}order/product/3de78642-de53-9714-745c-21208469530d/`,
  comDomain: `${baseUrl}order/product/825d96e7-63ed-0913-792c-417482528340/`,
  ukDomain: `${baseUrl}order/product/320e4357-95e7-8d18-050b-31643202d986/`,
  managementTraining: `${baseUrl}order/product/20403869-6e54-721d-2e7c-518d9305e7d2/`,
  startupPlanning: `${baseUrl}order/product/8d632507-9806-5d1e-de4a-8174e234e98d/`,
  uiTestProduct: `${baseUrl}order/product/3de78642-de53-9714-725b-21208469530d/`,
  recommendations1: `${baseUrl}order/product/78985742-6489-7012-852f-21e325d0ed36/`,
  recommendations2: `${baseUrl}order/product/320e4357-95e7-8d18-090c-31643202d986/`,
  rec1: `${baseUrl}order/product/5d085e69-d562-3719-6d5b-218e940d4237`,
  rec2: `${baseUrl}order/product/4d036794-24d0-e710-766a-3153698d582e`,
  rec3: `${baseUrl}order/product/8d632507-9806-5d1e-649c-8174e234e98d`,
  rec4: `${baseUrl}order/product/47d73824-8507-9315-940f-81e642d59e06`,
  rec5: `${baseUrl}order/product/5952098d-3de4-0917-230c-31578626e347`,
  rec6: `${baseUrl}order/product/20403869-6e54-721d-835f-518d9305e7d2`,
  rec7: `${baseUrl}order/product/3de78642-de53-9714-926b-21208469530d`,
  rec8: `${baseUrl}order/product/320e4357-95e7-8d18-d9db-31643202d986`,

  /* CATALOGUE URLS */
  catalogueRoot1: `${baseUrl}order/shop`,
  catalogueRoot2: `${baseUrl}order/shop?page=2`,
  categoryPage: `${baseUrl}order/shop?catid=5d085e69-d562-3719-794c-218e940d4237`,
  nestedCategoryPage: `${baseUrl}order/shop?catid=20403869-6e54-721d-593f-518d9305e7d2`,
  catalogueDomainSearch: `${baseUrl}order/shop?catid=8d632507-9806-5d1e-302f-8174e234e98d`,

  /* PROMOTION TESTING PRODUCT URLS*/
  fixedDiscount: `${baseUrl}order/product/825d96e7-63ed-0913-752b-417482528340/`,
  percentageDiscount: `${baseUrl}order/product/5d085e69-d562-3719-469c-218e940d4237/`,
  usdPromo: `${baseUrl}?pid=4d036794-24d0-e710-478a-3153698d582e&currency=usd`,
  gbpPromo: `${baseUrl}order/product/4d036794-24d0-e710-458c-3153698d582e/`,
  oneYearPromo: `${baseUrl}order/product/8d632507-9806-5d1e-d64b-8174e234e98d/`,
  priceListPromo: `${baseUrl}order/product/47d73824-8507-9315-798b-81e642d59e06/`,
  unlimitedRecurringPromo: `${baseUrl}order/product/5952098d-3de4-0917-724f-31578626e347/`,
  oneTimeRecurringPromo: `${baseUrl}order/product/20403869-6e54-721d-207a-518d9305e7d2/`,
  newClientPromo: `${baseUrl}order/product/3de78642-de53-9714-785a-21208469530d/`,
  existingClientPromo: `${baseUrl}order/product/78985742-6489-7012-8d2f-21e325d0ed36/`,
  worksWithOtherPromos: `${baseUrl}order/product/320e4357-95e7-8d18-020c-31643202d986/`,
  inactivePromo: `${baseUrl}order/product/5d085e69-d562-3719-489f-218e940d4237/`,
  singleUsePromo: `${baseUrl}order/product/2785d26e-9678-3d16-934b-314502e70439/`,
  autoAppliedPromo: `${baseUrl}order/product/825d96e7-63ed-0913-722a-417482528340/`,

  /* FREE TRIAL PRODUCT URLS */
  freeTrialsCategory: `${baseUrl}order/shop/?catid=78985742-6489-7012-266a-21e325d0ed36`,
  optionalTrialProduct: `${baseUrl}order/product/3de78642-de53-9714-986f-21208469530d/`,
  forcedTrialProduct: `${baseUrl}order/product/78985742-6489-7012-7d8b-21e325d0ed36/`,

  /* API URLS */
  apiUrl: "https://api.staging.upmind.io/",
  apiOrigin: `${baseUrl}`,
  apiGetToken: "oauth/access_token",
  apiGetBasket: "client/orders/current"
};

/* Product IDs for URL query string tests */
export const ProductIds = {
  consultingBlock: "20403869-6e54-721d-264c-518d9305e7d2",
  starterHosting: "3de78642-de53-9714-76df-21208469530d",
  sharedHostingCategory: "5d085e69-d562-3719-794c-218e940d4237",
  /* Subproduct IDs */
  subproductTokyo: "320e4357-95e7-8d18-077b-31643202d986",
  subproductMailbox: "4d036794-24d0-e710-42eb-3153698d582e",
  subproductOperatingSystem: "5952098d-3de4-0917-793c-31578626e347"
};

/* Helper to build product add URL */
export const productAddUrl = (productId: string) =>
  `${URLs.baseUrl}order/product/${productId}/`;
