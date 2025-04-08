// --- internal
import { useClientPhone } from "./useClientPhone";
import { useClientPhones } from "./useClientPhones";

// --- types
import type { IPhone, ICountry } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------
export const PhoneTypes = [
  { key: 1, value: "Mobile" },
  { key: 2, value: "Home" },
  { key: 3, value: "Office" },
  { key: 4, value: "Company" },
];

export interface PhoneModel {
  phone: {
    number: string;
    nationalNumber: string;
    countryCallingCode: string;
    country: string;
  };
  type: number;
  types: typeof PhoneTypes;
  country: {
    id: string;
    name: string;
    code: string;
    code3: string;
    created_at: string;
    updated_at: string;
    vat: string;
    eea: number;
    phone_code: string;
    post_code_regex: string;
  };
}

export interface Phone {
  country: IPhone["phone_country_code"];
  countryCallingCode: IPhone["phone_code"];
  default: IPhone["default"];
  description?: string;
  id: IPhone["id"];
  meta: {
    canDelete: boolean;
    isDefault: boolean;
    isVerified: boolean;
  };
  nationalNumber: IPhone["phone"];
  title: string;
  type: IPhone["type"];
}

export type UseClientPhone = ReturnType<typeof useClientPhone>;

export type UseClientPhones = ReturnType<typeof useClientPhones>;

export interface PhoneContext extends ClientItemContext {
  country: ICountry;
  types: typeof PhoneTypes;
}
