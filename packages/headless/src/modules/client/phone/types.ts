// --- external

// --- internal
import type { IPhone, ICountry } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------
export const PhoneTypes = [
  { key: 1, value: "Mobile" },
  { key: 2, value: "Home" },
  { key: 3, value: "Office" },
  { key: 4, value: "Company" },
];

export interface PhoneContext extends ClientItemContext {
  country: ICountry;
  types: typeof PhoneTypes;
}

export interface Phone {
  //--- identifier
  id: IPhone["id"];
  //--- computed details
  title: string;
  description?: string;
  //--- phone details
  type: IPhone["type"];
  default: IPhone["default"];
  country: IPhone["phone_country_code"];
  nationalNumber: IPhone["phone"];
  countryCallingCode: IPhone["phone_code"];
}
