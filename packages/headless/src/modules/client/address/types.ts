// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { PaginatedParams } from "../../query";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";
import type { ClientItemContext, ClientListingsContext } from "../types";
// -----------------------------------------------------------------------------

export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" },
];

export interface IAddressData {
  id?: string;
  name?: string | null;
  address1?: string;
  address2?: string;
  city?: string | null;
  postcode?: string | null;
  countryId?: ICountry["id"];
  country?: ICountry; // Requires relation
  regionId?: IRegion["id"];
  state?: string | null;
}

export interface AddressContext extends ClientItemContext {
  country?: ICountry;
  regions?: IRegion[];
  addresses: any; // Composable to the address context
  types?: typeof AddressTypes;
  baseModel?: IAddress;

  autocomplete?: {
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    model?: {
      search?: string;
      address?: string;
    };
    results?: any[]; //AddressAutocompleteResult[];
  };
  model?: IAddressData;
}

export interface AddressesContext extends ClientListingsContext {}

export interface ParsedAddress {
  // --- identifiers
  id: IAddress["id"];
  clientId: IAddress["client_id"];
  regionId: IAddress["region_id"];
  addressId: IAddress["id"];
  countryId: IAddress["country_id"];
  // --- company details
  companyId: null;
  companyName: null;
  companyDetails: false;
  // --- computed details
  title: string; // computed from name. Defaults to "New Address"
  description: string;
  // --- address details
  name: IAddress["name"];
  city: IAddress["city"];
  type: IAddress["type"];
  default: IAddress["default"];
  address1: IAddress["address_1"];
  address2: IAddress["address_2"];
  postcode: IAddress["postcode"];
  verified: IAddress["verified"];
  canDelete: IAddress["can_delete"];
}

export type UseClientAddresses = {
  /**
   * Check if the client addresses are loaded and ready.
   * @returns A promise that resolves to true when the addresses are ready.
   * @example isReady().then(() => console.log("Addresses are ready!"))
   */
  isReady: () => Promise<boolean>;
  /**
   * Get all the addresses for the current client.
   * @returns An array of parsed addresses if found, otherwise an empty array.
   * @example getAll() // returns all addresses for the current client
   */
  getAll: () => Promise<ParsedAddress[]>;
  /**
   * Get a single address by its id.
   * @param id The id of the address to get.
   * @returns The address object if found, otherwise undefined.
   * @example getOne("123") // returns the address with the id "123"
   */
  getOne: (id: IAddress["id"]) => Promise<ParsedAddress | undefined>;
  /**
   * Get addresses in a paged format.
   * @param paginationParams The pagination parameters to use.
   * @returns An object containing the addresses and pagination details.
   * @example getPaged({ limit: 10, offset: 0 }) // returns the first 10 addresses if 10 addresses are available
   */
  getPaged: (paginationParams: PaginatedParams) => Promise<ParsedAddress[]>;
  /**
   * Get the default address for the current client.
   * @returns The default address if found, otherwise undefined.
   * @example getDefault() // returns the address marked as default
   */
  getDefault: () => Promise<ParsedAddress | undefined>;
  /**
   * Filters the addresses based on the given filter.
   * @param param The filter string to filter the addresses with.
   * @returns An array of addresses that match the filter.
   * @example filter("home") // returns all addresses with "home" in the title or description
   */
  filter: (param: string) => Promise<ParsedAddress[]>;
  /**
   * Find a single address based on the given param. The param is matched against the title and description.
   * @param param The filter to match against the address title and description.
   * @returns The address object if found, otherwise undefined.
   * @example findOne("home") // returns an address with the title "Home Address"
   */
  findOne: (param: string) => Promise<ParsedAddress | undefined>;
  /**
   * Add a new address to the client.
   * @param address The address data to add.
   * @returns The newly added address object.
   * @example add({ title: "Home Address", description: "My home address" }) // adds a new address
   * @see {IAddressData} for the address data structure.
   */
  add: (address: IAddressData) => Promise<IAddressData | null>;
  /**
   * Remove an address from the client.
   * @param address The address data to remove.
   * @returns The removed address object.
   * @example remove({ id: "123" }) // removes the address with the id "123"
   * @see {IAddressData} for the address data structure.
   */
  remove: (id: IAddressData["id"]) => Promise<IAddressData | null>;
  /**
   * Update an existing address.
   * @param address The address data to update.
   * @returns The updated address object.
   * @example update({ id: "123", title: "Home Address", description: "My home address" }) // updates the address with the id "123"
   * @see {IAddressData} for the address data structure.
   */
  update: (address: IAddressData) => Promise<IAddressData | null>;
  /**
   * Mark an address as the default address for the client.
   * @param address The address data to set as default.
   * @returns The updated address object.
   * @example setDefault({ id: "123" }) // sets the address with the id "123" as default
   * @see {IAddressData} for the address data structure.
   */
  setDefault: (id: IAddressData["id"]) => Promise<IAddressData | null>;
};
