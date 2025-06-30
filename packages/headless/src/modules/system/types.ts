import type {
  IBillingCycle,
  ICountry,
  ICurrency,
  ILanguage,
  IRegion,
  IStatus,
  ITicketDepartment,
  ITaxBusinessType
} from "@upmind-automation/types";
import { QueryResponseError } from "../query";
// ---  Contexts

export interface SystemContext {
  currencies?: ICurrency[];
  billingCycles?: IBillingCycle[];
  countries?: ICountry[];
  regions?: Record<string, IRegion>;
  languages?: ILanguage[];
  statuses?: IStatus;
  departments?: ITicketDepartment[];
  systemIPAddresses?: string[];
  taxBusinessTypes?: ITaxBusinessType[];
  error?:
    | QueryResponseError
    | {
        currencies?: QueryResponseError;
        billingCycles?: QueryResponseError;
        countries?: QueryResponseError;
        regions?: QueryResponseError;
        languages?: QueryResponseError;
        statuses?: QueryResponseError;
        departments?: QueryResponseError;
      };
}
