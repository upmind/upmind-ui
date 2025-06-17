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
  devBlocks: `http://collabstudio.local:5173/product/add/3de78642-de53-9714-542c-21208469530d`,
  starterHosting: `${baseUrl}product/add/3de78642-de53-9714-76df-21208469530d`,
  advancedHosting: `http://collabstudio.local:5173/product/add/4d036794-24d0-e710-965b-3153698d582e`,
  goldPlanHosting: `${baseUrl}product/add/5d085e69-d562-3719-4e8a-218e940d4237`,
  logoDesign: `http://collabstudio.local:5173/product/add/47d73824-8507-9315-345f-81e642d59e06`,
  developerRetainer: `http://collabstudio.local:5173/product/add/8d632507-9806-5d1e-572f-8174e234e98d`,
  meeting: `http://collabstudio.local:5173/product/add/47d73824-8507-9315-385b-81e642d59e06`,
  consultingBlock: `http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2`,

  billingTermsPromo: `http://collabstudio.local:5173/product/add/20403869-6e54-721d-254a-518d9305e7d2`,

  comDomain: `http://collabstudio.local:5173/product/add/78985742-6489-7012-096c-21e325d0ed36`,
  ioDomain: `http://collabstudio.local:5173/product/add/5d085e69-d562-3719-e46c-218e940d4237`,
  orgDomain: `$http://collabstudio.local:5173/product/add/2785d26e-9678-3d16-72ea-314502e70439`,
  auDomain: `http://collabstudio.local:5173/product/add/8d632507-9806-5d1e-5d2f-8174e234e98d`,
  coukDomain: `$http://collabstudio.local:5173/product/add/2785d26e-9678-3d16-e9eb-314502e70439`,
  cozaDomain: `http://collabstudio.local:5173/product/add/78985742-6489-7012-286c-21e325d0ed36`,
  netDomain: `http://collabstudio.local:5173/product/add/825d96e7-63ed-0913-d07f-417482528340`,
  ukDomain: `http://collabstudio.local:5173/product/add/5d085e69-d562-3719-478b-218e940d4237`,

  /* API URLS */
  apiUrl: "https://api.staging.upmind.io/",
  apiOrigin: "http://qa-automation.local:5173",
  apiGetToken: "oauth/access_token",
  apiGetBasket: "client/orders/current",
};
