// --- types
import type {
  Email,
  Phone,
  Address,
  AddressModel,
  CompanyModel,
  PhoneModel,
  EmailModel,
} from "../../../client";
import type { ClientItemContext } from "../../../client/types";
import type { ICompany, ICountry, IRegion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export type UnifiedAddress = UnifiedAddressModel & {
  id: string;
  // --- context
  title: string;
  description: string;
  // --- meta info
  meta: {
    canDelete: boolean;
    isDefault: boolean;
    isVerified: boolean;
  };
};

export type UnifiedAddressModel = AddressModel &
  Omit<CompanyModel, "vatNumber" | "regNumber"> & {
    companyDetails?: boolean;
    companyId?: ICompany["id"];
    companyName?: ICompany["name"];
    regNumber?: ICompany["reg_number"];
    vatNumber?: ICompany["vat_number"];
    phone?: PhoneModel["phone"];
    email?: EmailModel["email"];
  };

export interface UnifiedAddressContext extends ClientItemContext {
  model: UnifiedAddressModel;
  baseModel: UnifiedAddressModel;
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  addresses: Address[];
  phones: Phone[];
  emails: Email[];
}
