// --- internal
import { useClientPhone } from "./useClientPhone";
import { useClientPhones } from "./useClientPhones";

// --- types
import type { IPhone, ICountry } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------

export interface IPhoneData {
  nationalNumber: string;
  countryCallingCode: string;
  country: string;
}

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
}

export interface Phone {
  id: IPhone["id"];
  title: string;
  description?: string;
  phone: PhoneModel["phone"];
  type: IPhone["type"];
  meta: {
    canDelete: boolean;
    isVerified: boolean;
    isDefault: boolean;
  };
}

export interface PhoneContext extends ClientItemContext<PhoneModel, Phone> {
  country?: ICountry;
  types?: typeof PhoneTypes;
}
