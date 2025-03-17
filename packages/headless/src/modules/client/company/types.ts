// --- external

// --- internal
import type { ICompany } from "@upmind-automation/types";
import type { PaginatedParams } from "../../query";
import type { ClientItemContext, ClientListingsContext } from "../types";
// -----------------------------------------------------------------------------

export interface CompanyContext extends ClientItemContext {
  addresses?: any;
}
export interface CompaniesContext extends ClientListingsContext {}

export interface Company {
  //--- identifiers
  id: ICompany["id"];
  emailId: ICompany["email_id"];
  phoneId: ICompany["phone_id"];
  addressId: ICompany["address_id"];
  // --- company details
  title: string; // computed from name. Defaults to "New Address"
  description: string;
  //--- company details
  name: ICompany["name"];
  regNumber: ICompany["reg_number"];
  vatNumber: ICompany["vat_number"];
  vatPercent: ICompany["vat_percent"];
}

export interface UseClientCompany {
  /**
   * Check if the client companies are loaded and ready
   * @returns A promise that resolves to a true when the companies are ready
   * @example isReady().then(() => console.log("Companies are ready!"))
   */
  isReady: () => Promise<boolean>;
  /**
   * Get all the companies for the current client.
   * @returns A promise that resolves to an array of companies
   * @example getAll().then(companies => console.log(companies))
   */
  getAll: () => Promise<Company[]>;
  /**
   * Get a company by its id
   * @param id The id of the company to get
   * @returns The company if found or undefined.
   * @example getOne("123").then(company => console.log(company))
   */
  getOne: (id: Company["id"]) => Promise<Company | undefined>;
  /**
   * Get companies in a paged format.
   * @param params The pagination parameters to use.
   * @returns A promise that resolves to an array of companies
   * @example getPaged({ page: 1, limit: 10 }).then(companies => console.log(companies))
   */
  getPaged: (params: PaginatedParams) => Promise<Company[]>;
  /**
   * Get the default company for the current client.
   * @returns A promise that resolves to the default company if found or undefined.
   * @example getDefault().then(company => console.log(company))
   */
  getDefault: () => Promise<Company | undefined>;
  /**
   * Find a single company by a search parameter. The search is case-insensitive and is matched against the company title and description.
   * @param param The search parameter to match against the company title and description
   * @returns The company if found or undefined.
   * @example findOne("home").then(companies => console.log(companies))
   */
  filter: (param: string) => Promise<Company[]>;
  /**
   * Find a single company by a search parameter. The search is case-insensitive and is matched against the company title and description.
   * @param param The search parameter to match against the company title and description.
   * @returns The company if found or undefined.
   * @example findOne("home").then(company => console.log(company))
   */
  findOne: (param: string) => Promise<Company | undefined>;
  /**
   * Add a new company to the client.
   * @param company The company data to add.
   * @returns Does not return anything.
   * @example add({ name: "My Company", emailId: "123", phoneId: "456", addressId: "789" }).catch(error => console.error(error))
   * @see {@link Company} for the company data structure.
   */
  add: (company: Company) => Promise<void>;
  /**
   * Remove a company from the client.
   * @param id The id of the company to remove.
   * @returns Does not return anything.
   * @example remove("123").catch(error => console.error(error))
   * @see {@link Company} for the company data structure.
   */
  remove: (id: Company["id"]) => Promise<void>;
  /**
   * Update a company for the client.
   * @param company The company data to update.
   * @returns Does not return anything.
   * @example update({ id: "123", name: "My Company", emailId: "123", phoneId: "456", addressId: "789" }).catch(error => console.error(error))
   * @see {@link Company} for the company data structure.
   */
  update: (company: Company) => Promise<void>;
  /**
   * Set a company as the default company for the client.
   * @param id The id of the company to set as default.
   * @returns Does not return anything.
   * @example setDefault("123").catch(error => console.error(error))
   * @see {@link Company} for the company data structure.
   */
  setDefault: (id: Company["id"]) => Promise<void>;
}
