// --- internal
import { useClientCompany } from "./useClientCompany";

// --- types
import type {
  IRegion,
  IAddress,
  ICompany,
  ICountry,
} from "@upmind-automation/types";
import type { UseClientEmails } from "../email";
import type { UseClientPhones } from "../phone";
import type { PaginatedParams } from "../../query";
import type { ClientItemContext } from "../types";
import type { UseClientAddresses } from "../address";

// -----------------------------------------------------------------------------

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
  default: ICompany["default"];
  regNumber: ICompany["reg_number"];
  vatNumber: ICompany["vat_number"];
  vatPercent: ICompany["vat_percent"];
}

export type UseClientCompany = ReturnType<typeof useClientCompany>;

export interface UseClientCompanies {
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
  getOne: (id: Company["id"]) => Company | undefined;
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
  filter: (param: string) => Company[];
  /**
   * Find a single company by a search parameter. The search is case-insensitive and is matched against the company title and description.
   * @param param The search parameter to match against the company title and description.
   * @returns The company if found or undefined.
   * @example findOne("home").then(company => console.log(company))
   */
  findOne: (param: string) => Company | undefined;
  /**
   * Get all the companies for the current client from the cache.
   * @returns An array of companies
   * @example getAllFromCache().then(companies => console.log(companies))
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  getAllFromCache: () => Company[];
}

export interface CompanyWithRelations extends ICompany {
  address: IAddress & { country: ICountry; region: IRegion };
}

export interface CompanyContext extends ClientItemContext {
  emails?: UseClientEmails;
  phones?: UseClientPhones;
  addresses?: UseClientAddresses;
}
