// --- external

// --- internal
import type { ICountry } from "@upmind-automation/types";
import type { ClientItemContext, ClientListingsContext } from "../types";

// -----------------------------------------------------------------------------
export const PhoneTypes: any[] = [
  { key: 1, value: "Mobile" },
  { key: 2, value: "Home" },
  { key: 3, value: "Office" },
  { key: 4, value: "Company" },
];

export interface IPhoneData {
  nationalNumber: string;
  countryCallingCode: string;
  country: string;
}

export interface PhoneContext extends ClientItemContext {
  country: ICountry;
  types: typeof PhoneTypes;
}

export interface PhonesContext extends ClientListingsContext {}
