import type { Address, AddressModel } from "../client-address";
import type { Email } from "../client-email";
import type { Phone, PhoneModel } from "../client-phone";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ICountry, ICompany, IRegion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Interface representing the data model for a company, suitable for forms
 * or API payloads. It encapsulates core company details and their associated
 * address, email, and phone references.
 */
export interface CompanyModel {
  /**
   * Optional unique identifier for the company. Present if editing an existing company.
   */
  id?: ICompany["id"];
  // --- One of
  /**
   * Optional unique identifier of the associated address. Mutually exclusive with the ` address ` object.
   */
  addressId?: ICompany["address_id"];
  /**
   * Optional full address model. Mutually exclusive with `addressId`.
   */
  address?: AddressModel["address"];
  // ---
  /**
   * Optional unique identifier of the associated email. Mutually exclusive with the ` email ` string.
   */
  emailId?: ICompany["email_id"];
  /**
   * Optional email address string. Mutually exclusive with `emailId`.
   */
  email?: Email["email"];
  // ---
  /**
   * Optional phone model. Mutually exclusive with `phoneId`.
   */
  phone?: PhoneModel["phone"];
  /**
   * Optional unique identifier of the associated phone. Mutually exclusive with `phone` object.
   */
  phoneId?: ICompany["phone_id"];
  // ---
  /**
   * The name of the company.
   */
  name?: ICompany["name"];
  /**
   * The registration number of the company.
   */
  regNumber?: ICompany["reg_number"];
  /**
   * Optional tax details for the company, e.g. VAT number.
   */
  tax?: {
    /** The VAT (Value Added Tax) number of the company. */
    number?: ICompany["vat_number"];
  };
  /**
   * `true` if this is the default company for the client.
   */
  default?: ICompany["default"];
}

/**
 * Interface representing a comprehensive company object, typically retrieved from the API.
 * It extends {@link CompanyModel} with additional identifiers, computed display fields,
 * detailed tax information, and meta-data about the company's status.
 */
export interface Company {
  //--- identifiers
  /**
   * The unique identifier for the company.
   */
  id: ICompany["id"];
  /**
   * The unique identifier of the associated email address.
   */
  emailId: ICompany["email_id"];
  /**
   * The unique identifier of the associated phone number.
   */
  phoneId: ICompany["phone_id"];
  /**
   * The unique identifier of the associated address.
   */
  addressId: ICompany["address_id"];
  // --- company details
  /**
   * A display title for the company, computed from its name.
   * Defaults to "New Company" if the name is not available.
   */
  title: string;
  /**
   * A detailed description of the company, often including its address and other contact info.
   */
  description: string;
  //--- company details
  /**
   * The name of the company.
   */
  name: ICompany["name"];
  /**
   * `true` if this is the default company for the client.
   */
  default: ICompany["default"];
  /**
   * The registration number of the company.
   */
  regNumber: ICompany["reg_number"];
  /**
   * Detailed tax information for the company, e.g. VAT details.
   */
  tax: {
    /** `true` if the VAT number has been successfully validated. */
    valid: ICompany["vat_validated"];
    /** The VAT percentage applied. */
    percent: ICompany["vat_percent"];
    /** The VAT number of the company. */
    number: ICompany["vat_number"];
    /** The reason why VAT validation failed, if applicable. */
    reason: ICompany["vat_validation_failed_reason"];
    /** Details about when the VAT number was last checked. */
    checked: {
      /** The date and time when VAT validation was last checked. */
      date: ICompany["vat_validation_checked_at"];
      /** A human-readable relative time string for when it was last checked. */
      relative: string;
    };
    /** The service or method used for VAT validation. */
    with: ICompany["vat_validated_with"];
  };
  // --- meta info
  /**
   * Meta-information about the company's status and abilities.
   */
  meta: {
    /** `true` if this is the client's default company. */
    isDefault: boolean;
    /** `true` if the company record can be deleted. */
    canDelete: boolean;
    /** `true` if the company's details have been verified. */
    isVerified: boolean;
    /** `true` if the company has associated tax details. */
    hasTax: boolean;
    /** `true` if the company's tax details have undergone validation. */
    hasTaxValidation: boolean;
    /** `true` if the company's tax details are valid. */
    hasValidTax: boolean;
  };
}

/**
 * Interface representing the context for company management within a client item context.
 * It extends `DataManagerContext` with specific data relevant to company operations,
 * such as associated addresses, emails, phones, and geographical lookups.
 *
 * @template TModel - The type of the company model, typically {@link CompanyModel}.
 */
export interface CompanyContext extends DataManagerContext<CompanyModel> {
  /** An array of all {@link Address} records associated with the client. */
  addresses: Address[];
  /** An array of all {@link Email} records associated with the client. */
  emails: Email[];
  /** An array of all {@link Phone} records associated with the client. */
  phones: Phone[];
  /** The currently selected {@link ICountry} object in the context. */
  country?: ICountry;
  /** An array of {@link IRegion} objects available for the selected country. */
  regions?: IRegion[];
  /** An array of all available {@link ICountry} objects in the system. */
  countries: ICountry[];
  /** `true` if the context is in a minimal mode, potentially showing fewer fields or details. */
  minimal?: boolean;
}
