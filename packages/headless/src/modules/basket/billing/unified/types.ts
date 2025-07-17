// --- types
import type {
  Email,
  Phone,
  Address,
  AddressModel,
  CompanyModel,
  PhoneModel,
  Company
} from "../../../client";
import type { ClientItemContext } from "../../../client/types";
import type { ICountry, IRegion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export enum UnifiedType {
  PERSONAL = "personal",
  BUSINESS = "business"
}

export type UnifiedModel = {
  address?: AddressModel["address"];
  company?: CompanyModel;
  phone?: PhoneModel;
};

export interface UnifiedContext extends ClientItemContext<UnifiedModel> {
  type: UnifiedType;
  // --- lookups
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  addresses: Address[];
  companies: Company[];
  phones: Phone[];
  emails: Email[];
}
