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
  IAddress,
  ICompany,
  ICountry,
  IPhone,
  IRegion,
} from "@upmind-automation/types";

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

export type UnifiedAddressModel = {
  addressId?: IAddress["id"];
  companyId?: ICompany["id"];
  phoneId?: IPhone["id"];
  address?: AddressModel;
  company?: CompanyDetailsModel;
  phone?: PhoneModel["phone"];
  type: number;
};

export type CompanyDetailsModel = Omit<
  CompanyModel,
  "vatNumber" | "regNumber"
> & {
  addressId?: IAddress["id"];
  companyId?: ICompany["id"];
  companyName?: ICompany["name"];
  regNumber?: ICompany["reg_number"];
  vatNumber?: ICompany["vat_number"];
  email?: EmailModel["email"];
};

export interface UnifiedAddressContext
  extends ClientItemContext<UnifiedAddressModel, UnifiedAddress> {
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  addresses: Address[];
  companies: Company[];
  phones: Phone[];
  emails: Email[];
}
