// --- internal
import { usePlaces } from "../places";
import { useClientAddress } from "./useClientAddress";

// --- types
import type { PaginatedParams } from "../../query";
import type { ClientItemContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" },
];

export interface AddressModel {
  address1: IAddress["address_1"];
  address2?: IAddress["address_2"];
  city: IAddress["city"];
  countryId: IAddress["country_id"];
  name?: IAddress["name"];
  postcode: IAddress["postcode"];
  regionId?: IAddress["region_id"];
  state?: IAddress["state"];
  type: IAddress["type"];
}

export interface Address extends AddressModel {
  // --- identifiers
  id: IAddress["id"];
  clientId: IAddress["client_id"];
  // --- computed
  title: string;
  description: string;
  // --- meta info
  meta: {
    canDelete: IAddress["can_delete"];
    isVerified: IAddress["verified"];
    isDefault: IAddress["default"];
  };
}

export interface IAddressWithRelations extends IAddress {
  country: ICountry;
  region: IRegion;
}

export type UseClientAddress = ReturnType<typeof useClientAddress>;

export interface UseClientAddresses {
  /**
   * Check if the client addresses are loaded and ready.
   * @returns A promise that resolves to true when the addresses are ready.
   * @example isReady().then(() => console.log("Addresses are ready!"))
   */
  isReady: () => Promise<boolean>;
  /**
   * Get all the addresses for the current client.
   * @returns An array of parsed addresses if found, otherwise an empty array.
   * @example getAll().then((addresses) => console.log(addresses))
   */
  getAll: () => Promise<Address[]>;
  /**
   * Get a single address by id.
   * @param id The id of the address to get.
   * @returns The address object if found, otherwise undefined.
   * @example getOne("123").then((address) => console.log(address))
   */
  getOne: (id: Address["id"]) => Address | undefined;
  /**
   * Get addresses in a paged format.
   * @param paginationParams The pagination parameters to use.
   * @returns An object containing the addresses and pagination details.
   * @example getPaged({ limit: 10, offset: 0 }) // returns the first 10 addresses if 10 addresses are available
   */
  getPaged: (paginationParams: PaginatedParams) => Promise<Address[]>;
  /**
   * Get the default address for the current client.
   * @returns The default address if found, otherwise undefined.
   * @example getDefault().then((address) => console.log(address))
   */
  getDefault: () => Promise<Address | undefined>;
  /**
   * Filters the addresses by name or description.
   * @param param The filter string to filter the addresses with.
   * @returns An array of addresses that match the filter.
   * @example filter("home").then((addresses) => console.log(addresses))
   */
  filter: (param: string) => Address[];
  /**
   * Find a single address based on the given param. The param is matched against the title and description.
   * @param param The filter to match against the address title and description.
   * @returns The address object if found, otherwise undefined.
   * @example findOne("home").then((address) => console.log(address))
   */
  findOne: (param: string) => Address | undefined;
  /**
   * Get all the addresses from the cache.
   * @returns An array of parsed addresses if found, otherwise an empty array.
   * @example getAllFromCache().then((addresses) => console.log(addresses))
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  getAllFromCache: () => Address[];
}

export interface AddressContext extends ClientItemContext {
  types?: typeof AddressTypes;
  model?: AddressModel;
  id?: Address["id"];
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  baseModel?: Address;
}
