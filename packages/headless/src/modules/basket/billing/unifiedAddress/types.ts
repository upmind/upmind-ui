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

export enum UnifiedAddressType {
  PERSONAL = "personal",
  BUSINESS = "business",
}

export type UnifiedAddressModel = {
  address?: AddressModel;
  company?: CompanyModel;
  phone?: PhoneModel;
};

export interface UnifiedAddressContext
  extends ClientItemContext<UnifiedAddressModel> {
  type: UnifiedAddressType;
  // --- lookups
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  addresses: Address[];
  companies: Company[];
  phones: Phone[];
  emails: Email[];
}
