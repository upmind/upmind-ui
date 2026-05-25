export const products = {
  STARTER_HOSTING: {
    id: "3de78642-de53-9714-76df-21208469530d",
    name: "Starter Hosting",
    billingCycle: 24,
    gbpPrice: "£60.00",
    type: "hosting"
  },
  FREE_HOSTING: {
    id: "4d036794-24d0-e710-746a-3153698d582e",
    name: "Free Hosting",
    billingCycle: 1,
    gbpPrice: "£0.00",
    type: "hosting"
  },
  OPTIONAL_TRIAL_PRODUCT: {
    id: "3de78642-de53-9714-986f-21208469530d",
    name: "Trial Product (Optional)",
    billingCycle: 12,
    gbpPrice: "£10.00",
    type: "hosting"
  },
  FORCED_TRIAL_PRODUCT: {
    id: "78985742-6489-7012-7d8b-21e325d0ed36",
    name: "Trial Product (Forced)",
    billingCycle: 12,
    gbpPrice: "£10.00",
    type: "hosting"
  },
  TAX_FREE_PRODUCT: {
    id: "825d96e7-63ed-0913-52eb-417482528340",
    name: "Tax Free Product",
    billingCycle: 24,
    gbpPrice: "£60.00",
    type: "hosting"
  },
  FREE_PRODUCT: {
    id: "4d036794-24d0-e710-746a-3153698d582e",
    name: "Free Product",
    billingCycle: 1,
    gbpPrice: "£0.00",
    type: "hosting"
  },
  DOMAIN: {
    id: "5d085e69-d562-3719-459a-218e940d4237",
    name: ".org Domain Registration",
    billingCycle: 12,
    gbpPrice: "£12.00",
    type: "domain"
  },
  HAT: {
    /** Single price, no terms, no options/attributes, no provision fields. */
    id: "47d73824-8507-9315-9e0b-81e642d59e06",
    name: "Hat (Non-Configurable Product)",
    billingCycle: 1,
    gbpPrice: "£10.00",
    type: "apparel"
  },
  TSHIRT: {
    /** Has options or attributes — must navigate to configure regardless. */
    id: "5952098d-3de4-0917-250b-31578626e347",
    name: "T-Shirt",
    billingCycle: 1,
    gbpPrice: "£10.00",
    type: "apparel"
  },
  DOMAIN_2: {
    id: "4d036794-24d0-e710-488b-3153698d582e",
    name: ".au Domain",
    billingCycle: 12,
    gbpPrice: "£20.00",
    type: "domain"
  },
  DOMAIN_3: {
    id: "5d085e69-d562-3719-459a-218e940d4237",
    name: ".org Domain",
    billingCycle: 12,
    gbpPrice: "£12.00",
    type: "domain"
  },
  SERVER_A: {
    id: "8d632507-9806-5d1e-629b-8174e234e98d",
    name: "Server A",
    billingCycle: 1,
    gbpPrice: "£150.00",
    type: "server"
  },
  SERVER_B: {
    id: "47d73824-8507-9315-920b-81e642d59e06",
    name: "Server B",
    billingCycle: 1,
    gbpPrice: "£150.00",
    type: "server"
  }
};
