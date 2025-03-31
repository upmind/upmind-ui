// --- internal
import { useClientPhone } from "./useClientPhone";

// --- types
import type { PaginatedParams } from "../../query";
import type { IPhone, ICountry } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";
import { useClientPhones } from "./useClientPhones";

// -----------------------------------------------------------------------------
export const PhoneTypes = [
  { key: 1, value: "Mobile" },
  { key: 2, value: "Home" },
  { key: 3, value: "Office" },
  { key: 4, value: "Company" },
];

export interface PhoneModel {
  country: IPhone["phone_country_code"];
  countryCallingCode: IPhone["phone_code"];
  nationalNumber: IPhone["phone"];
  phone: IPhone["phone"];
  type: IPhone["type"];
}

export interface Phone {
  country: IPhone["phone_country_code"];
  countryCallingCode: IPhone["phone_code"];
  default: IPhone["default"];
  description?: string;
  id: IPhone["id"];
  meta: {
    canDelete: IPhone["can_delete"];
    isDefault: IPhone["default"];
    isVerified: IPhone["verified"];
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
