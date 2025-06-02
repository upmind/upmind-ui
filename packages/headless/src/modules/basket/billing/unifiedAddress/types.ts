// --- types
import type {
  Email,
  Phone,
  Address,
  AddressModel,
  CompanyModel,
  PhoneModel,
  EmailModel,
  Company,
} from "../../../client";
import type { ClientItemContext } from "../../../client/types";
import type {
  BrandConfigKeys,
  IAddress,
  ICompany,
  ICountry,
  IRegion,
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export type UnifiedAddress = UnifiedAddressModel & {
  id: string;
  // --- computed
  title: string;
  description: string;
  // --- meta info
  meta: {
    canDelete: boolean;
    isDefault: boolean;
    isVerified: boolean;
  };
};

export type UnifiedAddressModel = {
  addressId?: IAddress["id"];
  companyId?: ICompany["id"];
  address?: AddressModel;
  company?: CompanyDetailsModel;
  phone?: PhoneModel["phone"];
  type: number;
};

export type CompanyDetailsModel = Omit<
  CompanyModel,
  "vatNumber" | "regNumber"
> & {
  companyId?: ICompany["id"];
  companyName?: ICompany["name"];
  regNumber?: ICompany["reg_number"];
  vatNumber?: ICompany["vat_number"];
  email?: EmailModel["email"];
};

export interface UnifiedAddressContext extends ClientItemContext {
  model: UnifiedAddressModel;
  baseModel: UnifiedAddressModel;
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  addresses: Address[];
  companies: Company[];
  phones: Phone[];
  emails: Email[];
  config?: Record<BrandConfigKeys, boolean>;
}
