// --- internal

// --- types
import type { ClientItemContext } from "../types";
import type {
  ICountry,
  ICompany,
  BrandConfigKeys,
  IRegion
} from "@upmind-automation/types";
import type { Email, Phone, Address, PhoneModel, AddressModel } from "..";

// -----------------------------------------------------------------------------

export interface CompanyModel {
  id?: ICompany["id"];
  // --- One of
  addressId?: ICompany["address_id"];
  address?: AddressModel["address"];
  // ---
  emailId?: ICompany["email_id"];
  email?: Email["email"];
  // ---
  phone?: PhoneModel["phone"];
  phoneId?: ICompany["phone_id"];
  // ---
  name?: ICompany["name"];
  regNumber?: ICompany["reg_number"];
  vatNumber?: ICompany["vat_number"];
  default?: ICompany["default"];
}

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
  vat: {
    valid: ICompany["vat_validated"];
    percent: ICompany["vat_percent"];
    number: ICompany["vat_number"];
    reason: ICompany["vat_validation_failed_reason"];
    checked: {
      date: ICompany["vat_validation_checked_at"];
      relative: string;
    };
    with: ICompany["vat_validated_with"];
  };
  // --- meta info
  meta: {
    isDefault: boolean;
    canDelete: boolean;
    isVerified: boolean;
    hasVat: boolean;
    hasVatValidation: boolean;
    hasValidVat: boolean;
  };
}

export interface CompanyContext extends ClientItemContext<CompanyModel> {
  addresses: Address[];
  emails: Email[];
  phones: Phone[];
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  minimal: boolean;
}
