// --- internal
import { useClientCompany } from "./useClientCompany";
import { useClientCompanies } from "./useClientCompanies";

// --- types
import type {
  IRegion,
  IAddress,
  ICompany,
  ICountry,
} from "@upmind-automation/types";
import type { UseClientEmails } from "../email";
import type { UseClientPhones } from "../phone";
import type { ClientItemContext } from "../types";
import type { UseClientAddresses } from "../address";

// -----------------------------------------------------------------------------

export interface CompanyModel {
  addressId: ICompany["address_id"];
  default: ICompany["default"];
  emailId: ICompany["email_id"];
  name: ICompany["name"];
  phoneId: ICompany["phone_id"];
  regNumber: ICompany["reg_number"];
  vatNumber: ICompany["vat_number"];
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
    isDefault: ICompany["default"];
    canDelete: ICompany["can_delete"];
    isVerified: ICompany["verified"];
  };
}

export type UseClientCompany = ReturnType<typeof useClientCompany>;

export type UseClientCompanies = ReturnType<typeof useClientCompanies>;

export interface CompanyWithRelations extends ICompany {
  address: IAddress & { country: ICountry; region: IRegion };
}

export interface CompanyContext extends ClientItemContext {
  emails?: UseClientEmails;
  phones?: UseClientPhones;
  addresses?: UseClientAddresses;
}
