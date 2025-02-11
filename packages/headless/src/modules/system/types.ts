export type { RequestError, RequestResponse } from "../api/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Interfaces

export interface IBillingCycle {
  id: string;
  months: number;
  name: string;
  recurring: number;
}

export interface IBillingTermField {
  id: number;
  label: string;
}

export interface IBillingTermsOption {
  value: number | string;
  label: string;
}

export interface ICountry {
  code: string;
  created_at: string;
  eea: number;
  id: string;
  name: string;
  phone_code: string;
  updated_at: number;
}

export interface ICurrency {
  id: string;
  code: string;
  name: string;
  prefix: string;
  suffix: string;
  base: boolean;
  created_at: string;
  decimals: boolean;
  manual: number;
  updated_at: string;
}

export interface ILanguage {
  code: string;
  created_at: string;
  id: string;
  language: string;
  updated_at: string;
}

export interface IRegion {
  id: string;
  country_id: ICountry["id"];
  code: string;
  name: string;
}

export interface IStatus {
  code: string;
  created_at: string;
  deleted_at: null | string;
  id: string;
  name: string;
  // TODO:
  // object_type: UpmindObjectTypes;
  object_type: any;
  updated_at: string;
}

export interface IStatuses {
  ticket: IStatus[] | null;
  invoice: IStatus[] | null;
}

export interface ITicketDepartment {
  // TODO:
  // brand: IBrand;
  // brand_id: IBrand["id"];
  brand: any;
  brand_id: any["id"];
  brand_ticket_departments: ITicketDepartment;
  code: string;
  default: boolean;
  id: string;
  is_public: boolean;
  name: string;
  name_translated?: string;
  // TODO:
  // translations: ITranslation[];
  translations: any[];
  username: string | null;
}

// --------------------------------------------------------
// Contexts

export interface SystemContext {
  currencies: ICurrency[] | null;
  billingCycles: IBillingCycle[] | null;
  countries: ICountry[] | null;
  regions: Record<string, IRegion> | null;
  languages: ILanguage[] | null;
  statuses: IStatuses | null;
  departments: ITicketDepartment[] | null;
  systemIPAddresses: string[] | null;
  // TODO:
  // taxBusinessTypes: ITaxBusinessType[] | null;
  taxBusinessTypes: any[];
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}
