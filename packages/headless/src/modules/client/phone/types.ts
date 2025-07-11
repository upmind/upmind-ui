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

export interface PhoneModel {
  id?: IPhone["id"];
  phone: {
    number: string;
    nationalNumber: string;
    countryCallingCode: string;
    country: string;
  };
  // type?: number; // deprecated
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

export interface PhoneContext extends ClientItemContext<PhoneModel> {
  country?: ICountry;
}
