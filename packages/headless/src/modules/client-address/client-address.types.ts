import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * An array of predefined address types, used for categorising different kinds of addresses.
 * Each object contains a numeric `key` and a human-readable `value`.
 */
export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" }
];

/**
 * A constant object mapping human-readable names to their corresponding numeric keys
 * from the {@link AddressTypes} array. This provides a type-safe way to reference
 * address types in code.
 */
export const ADDRESS_TYPE_KEYS = {
  HOME: AddressTypes[0].key,
  OFFICE: AddressTypes[1].key,
  HOLIDAY: AddressTypes[2].key,
  COMPANY: AddressTypes[3].key
} as const;

/**
 * Interface representing the data model for an address, suitable for forms
 * or API payloads. It encapsulates the core geographical details of an address.
 */
export interface AddressModel {
  /**
   * Optional unique identifier for the address. Present if editing an existing address.
   */
  id?: IAddress["id"];
  /**
   * Optional name or label for the address (e.g. "My Home Address").
   */
  name?: IAddress["name"];
  /**
   * An object containing the primary components of a physical address.
   */
  address: {
    /**
     * The first line of the address (e.g. street name and number).
     */
    address1: IAddress["address_1"];
    /**
     * The second line of the address (e.g. flat, suite, or unit number). Optional.
     */
    address2?: IAddress["address_2"];
    /**
     * The city of the address.
     */
    city: IAddress["city"];
    /**
     * The ID of the country for the address.
     */
    countryId: IAddress["country_id"];
    /**
     * The postal code or Postcode of the address.
     */
    postcode: IAddress["postcode"];
    /**
     * The ID of the region for the address. Optional, depending on country.
     */
    regionId?: IAddress["region_id"];
    /**
     * The state or province name for the address. Optional, depending on country.
     */
    state?: IAddress["state"];
  };
}

/**
 * Interface representing a comprehensive address object, extending {@link AddressModel}
 * with additional identifiers, contextual information, and meta-data about the address.
 * This is typically used for addresses retrieved from the API or displayed in the UI.
 */
export interface Address extends AddressModel {
  // --- identifiers
  /**
   * The unique identifier for the address.
   */
  id: IAddress["id"];
  /**
   * The unique identifier of the client to whom this address belongs.
   */
  clientId: IAddress["client_id"];
  // --- context
  /**
   * A display title for the address (e.g. "Home Address").
   */
  title: string;
  /**
   * The name of the country for this address.
   */
  countryName?: string;
  /**
   * A detailed description of the address, potentially including full address lines.
   */
  description: string;
  /**
   * The name of the region/state for this address.
   */
  regionName?: string;
  /**
   * The type of address, corresponding to keys in {@link AddressTypes} (e.g., 1 for "Home").
   */
  type: IAddress["type"];
  // --- meta info
  /**
   * Meta-information about the address's status and capabilities.
   */
  meta: {
    /**
     * Indicates whether the client can delete the address.
     */
    canDelete: boolean;
    /**
     * Indicates whether this is the client's default address.
     */
    isDefault: boolean;
    /**
     * Indicates whether the address has been verified.
     */
    isVerified: boolean;
  };
}

/**
 * Interface representing the context for address management within a client item context.
 * It extends `DataManagerContext` with specific data relevant to address operations,
 * such as geographical lookups.
 *
 * @template TModel - The type of the address model, typically {@link AddressModel}.
 */
export interface AddressContext extends DataManagerContext<AddressModel> {
  /**
   * The currently selected country object in the context.
   */
  country?: ICountry;
  /**
   * An array of regions available for the selected country.
   * Used for address form fields.
   */
  regions?: IRegion[];
  /**
   * An array of all available countries in the system for selection in address forms.
   */
  countries: ICountry[];
}
