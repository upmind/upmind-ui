// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";
import type { ClientItemContext, ClientListingsContext } from "../types";
import { ICountry } from "@upmind-automation/types";

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
