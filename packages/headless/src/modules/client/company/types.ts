// --- internal

// --- types
import type { ClientItemContext } from "../types";
import type {
  ICountry,
  ICompany,
  BrandConfigKeys,
} from "@upmind-automation/types";
import type { Email, Phone, Address, PhoneModel } from "..";

// -----------------------------------------------------------------------------

export interface CompanyModel {
  addressId?: ICompany["address_id"];
  default?: ICompany["default"];
  emailId?: ICompany["email_id"];
  phone?: PhoneModel["phone"];
  name: ICompany["name"];
  phoneId?: ICompany["phone_id"];
  regNumber?: ICompany["reg_number"];
  vatNumber?: ICompany["vat_number"];
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
  vatNumber: ICompany["vat_number"];
  vatPercent: ICompany["vat_percent"];
  // --- meta info
  meta: {
    isDefault: boolean;
    canDelete: boolean;
    isVerified: boolean;
  };
}

export interface CompanyContext
  extends ClientItemContext<CompanyModel, Company> {
  addresses: Address[];
  emails: Email[];
  phones: Phone[];
  country?: ICountry;
}
