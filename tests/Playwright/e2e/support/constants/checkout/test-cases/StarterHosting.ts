import { faker } from "@faker-js/faker";

const randomDomain1 = `${faker.string.alpha(8).toLowerCase()}-${faker.string.alpha(8).toLowerCase()}.uk`;
const randomDomain2 = `${faker.string.alpha(8).toLowerCase()}-${faker.string.alpha(8).toLowerCase()}.uk`;
const randomDomain3 = `${faker.string.alpha(8).toLowerCase()}-${faker.string.alpha(8).toLowerCase()}.uk`;

export const StarterHosting = [
  /* Register New Domain */
  {
    name: "Billing term: 1 Month - Account Domain Name: Register New Domain @starter-hosting @new-domain",
    billingTerm: "Monthly",
    total: "£4.00",
    billingCycle: "1-month",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain1,
    domainSelection: [0]
  },
  {
    name: "Billing term: 1 year - Account Domain Name: Register New Domain @starter-hosting @new-domain",
    billingTerm: "Annually",
    total: "£40.00",
    billingCycle: "1-year",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain2,
    domainSelection: [0]
  },
  {
    name: "Billing term: 2 year - Account Domain Name: Register New Domain @starter-hosting @new-domain",
    billingTerm: "Biennially",
    total: "£60.00",
    billingCycle: "2-year",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain3,
    domainSelection: [0]
  },

  /* Transfer Domain */
  {
    name: "Billing term: 1 Month - Account Domain Name: Transfer Domain @starter-hosting @transfer-domain",
    billingTerm: "Monthly",
    total: "£4.00",
    billingCycle: "1-month",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain1,
    domainSelection: [1]
  },
  {
    name: "Billing term: 1 year - Account Domain Name: Transfer Domain @starter-hosting @transfer-domain",
    billingTerm: "Annually",
    total: "£40.00",
    billingCycle: "1-year",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain2,
    domainSelection: [1]
  },
  {
    name: "Billing term: 2 year - Account Domain Name: Transfer Domain @starter-hosting @transfer-domain",
    billingTerm: "Biennially",
    total: "£60.00",
    billingCycle: "2-year",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain3,
    domainSelection: [1]
  },

  /* Use Existing Domain */
  {
    name: "Billing term: 1 Month - Account Domain Name: Register New Domain @starter-hosting @existing-domain",
    billingTerm: "Monthly",
    total: "£4.00",
    billingCycle: "1-month",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain1,
    domainSelection: [2]
  },
  {
    name: "Billing term: 1 year - Account Domain Name: Register New Domain @starter-hosting @existing-domain",
    billingTerm: "Annually",
    total: "£40.00",
    billingCycle: "1-year",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain2,
    domainSelection: [2]
  },
  {
    name: "Billing term: 2 year - Account Domain Name: Register New Domain @starter-hosting @existing-domain",
    billingTerm: "Biennially",
    total: "£60.00",
    billingCycle: "2-year",
    addons: "",
    webHosting: "Starter Hosting",
    domainName: randomDomain3,
    domainSelection: [2]
  }
];
