import playwrightConfig from "../../../playwright.config";

const baseUrl = playwrightConfig.use?.baseURL;

export const URLs = {
  /* GENERIC URLS */
  baseUrl,
  basket: `${baseUrl}basket`,

  /* ADD PRODUCT URLS */
  devBlocks: `${baseUrl}product/add/3de78642-de53-9714-542c-21208469530d`,
  starterHosting: `${baseUrl}product/add/5d085e69-d562-3719-7d6f-218e940d4237`,
  logoDesign: `${baseUrl}product/add/47d73824-8507-9315-345f-81e642d59e06`,
  developerRetainer: `${baseUrl}product/add/8d632507-9806-5d1e-572f-8174e234e98d`,
  meeting: `${baseUrl}product/add/47d73824-8507-9315-385b-81e642d59e06`,
  advancedHosting: `${baseUrl}product/add/4d036794-24d0-e710-965b-3153698d582e`,
  consultingBlock: `${baseUrl}product/add/5952098d-3de4-0917-e88b-31578626e347`,

  billingTermsPromo: `${baseUrl}product/add/20403869-6e54-721d-254a-518d9305e7d2`,

  comDomain: `${baseUrl}product/add/78985742-6489-7012-096c-21e325d0ed36`,
  ioDomain: `${baseUrl}product/add/5d085e69-d562-3719-e46c-218e940d4237`,
  orgDomain: `${baseUrl}product/add/2785d26e-9678-3d16-72ea-314502e70439`,
  auDomain: `${baseUrl}product/add/8d632507-9806-5d1e-5d2f-8174e234e98d`,
  coukDomain: `${baseUrl}product/add/2785d26e-9678-3d16-e9eb-314502e70439`,
  cozaDomain: `${baseUrl}product/add/78985742-6489-7012-286c-21e325d0ed36`,
  netDomain: `${baseUrl}product/add/825d96e7-63ed-0913-d07f-417482528340`,
  ukDomain: `${baseUrl}product/add/5d085e69-d562-3719-478b-218e940d4237`,
};
