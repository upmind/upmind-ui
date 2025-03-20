// --- internal
import type { PaginatedParams } from "../../query";
import type { IPhone, ICountry } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------
export const PhoneTypes = [
  { key: 1, value: "Mobile" },
  { key: 2, value: "Home" },
  { key: 3, value: "Office" },
  { key: 4, value: "Company" },
];

export interface PhoneContext extends ClientItemContext {
  country: ICountry;
  types: typeof PhoneTypes;
}

export interface Phone {
  //--- identifier
  id: IPhone["id"];
  //--- computed details
  title: string;
  description?: string;
  //--- phone details
  type: IPhone["type"];
  default: IPhone["default"];
  country: IPhone["phone_country_code"];
  nationalNumber: IPhone["phone"];
  countryCallingCode: IPhone["phone_code"];
}

export interface UseClientPhones {
  /**
   * Check if the client phones are loaded and ready
   * @returns A promise that resolves to a true when the phones are ready
   * @example isReady().then(() => console.log("Phones are ready!"))
   */
  isReady: () => Promise<boolean>;
  /**
   * Get all the phones for the current client.
   * @returns A promise that resolves to an array of phones
   * @example getAll().then(phones => console.log(phones))
   */
  getAll: () => Promise<Phone[]>;
  /**
   * Get a phone by its id
   * @param id The id of the phone to get
   * @returns The phone if found or undefined.
   * @example getOne("123").then(phone => console.log(phone))
   */
  getOne: (id: Phone["id"]) => Promise<Phone | undefined>;
  /**
   * Get phones in a paged format.
   * @param params The pagination parameters to use.
   * @returns A promise that resolves to an array of phones
   * @example getPaged({ page: 1, limit: 10 }).then(phones => console.log(phones))
   */
  getPaged: (params: PaginatedParams) => Promise<Phone[]>;
  /**
   * Get the default phone for the current client.
   * @returns A promise that resolves to the default phone if found or undefined.
   * @example getDefault().then(phone => console.log(phone))
   */
  getDefault: () => Promise<Phone | undefined>;
  /**
   * Find a phone by a search parameter
   * @param param The search parameter to use
   * @returns The phone if found or undefined.
   * @example findOne("123").then(phone => console.log(phone))
   */
  findOne: (param: string) => Promise<Phone | undefined>;
  /**
   * Filter phones by a search parameter
   * @param param The search parameter to use
   * @returns An array of phones that match the search parameter
   * @example filter("123").then(phones => console.log(phones))
   */
  filter: (param: string) => Promise<Phone[]>;
  /**
   * Get all phones for the current client from the cache
   * @returns An array of phones
   * @example getAllFromCache().then(phones => console.log(phones))
   * @see {@link Phone} for the phone details
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  getAllFromCache: () => Phone[];
}
