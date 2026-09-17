import type { Address, AddressModel } from "../../client-address";
import type { Company, CompanyModel } from "../../client-company";
import type { Email } from "../../client-email";
import type { Phone, PhoneModel } from "../../client-phone";
import type { DataManagerContext } from "../../data-manager/data-manager.types";
import type { ICountry, IRegion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Enumeration representing the two primary types of unified profiles or entities:
 * 'personal' for individual clients and 'business' for corporate or organisational clients.
 * This helps in distinguishing the nature of a client's profile for the appropriate data handling
 * and form rendering.
 *
 * @enum {string}
 */
export enum UnifiedType {
  /**
   * Represents a personal or individual client profile.
   * Typically used for single users, freelancers, or consumers.
   */
  PERSONAL = "personal",
  /**
   * Represents a business or organisational client profile.
   * Typically used for companies, enterprises, or institutions.
   */
  BUSINESS = "business"
}

/**
 * Type alias representing a unified data model that can encompass address,
 * company, and phone details, often used for forms or profile management
 * where different types of client data are consolidated.
 */
export type UnifiedModel = {
  /**
   * The address details associated with the unified model.
   * This property is optional and might not be present for all unified types.
   */
  address?: AddressModel["address"];
  /**
   * The company details associated with the unified model.
   * This property is typically present for 'BUSINESS' `UnifiedType`.
   */
  company?: CompanyModel;
  /**
   * The phone details associated with the unified model.
   * This property is optional.
   */
  phone?: PhoneModel;
};

/**
 * Interface representing the context for a unified client item, extending
 * `DataManagerContext` to include specific details related to the unified type
 * such as addresses, companies, phones, emails, and geographical lookups.
 * This context provides a comprehensive view of a client's unified profile.
 */
export interface UnifiedContext extends DataManagerContext<UnifiedModel> {
  /**
   * The type of the unified client profile, indicating whether it's 'personal' or 'business'.
   */
  type: UnifiedType;
  // --- lookups
  /**
   * The selected country object for geographical lookups or associated with the client's address.
   */
  country?: ICountry;
  /**
   * An array of regions (e.g. states, provinces) available for the selected country.
   * Used for address validation and selection.
   */
  regions?: IRegion[];
  /**
   * An array of all available countries in the system for selection.
   */
  countries: ICountry[];
  /**
   * An array of all addresses associated with the client.
   */
  addresses: Address[];
  /**
   * An array of all companies associated with the client.
   * Typically populated for 'BUSINESS' type clients.
   */
  companies: Company[];
  /**
   * An array of all phone numbers associated with the client.
   */
  phones: Phone[];
  /**
   * An array of all email addresses associated with the client.
   */
  emails: Email[];
}
