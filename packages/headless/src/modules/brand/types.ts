// --- internal
// import type { RequestError } from "..//api/types";
import type {
  IBrand,
  OrgFeatureKeys,
  BrandConfigKeys,
} from "@upmind-automation/types";

// --------------------------------------------------------
// Contexts

export interface BrandContext extends IBrand {
  keys: {
    config: BrandConfigKeys[];
    organisation: OrgFeatureKeys[];
  };
  modules?: any;
  config?: BrandConfigKeys;
  organisation?: OrgFeatureKeys;
  initialised?: boolean;
  error?: any; //TODO:  RequestError;
}

// --------------------------------------------------------
// Events

export interface BrandEvent {
  type: string;
  data: any;
  error?: any; //TODO:  RequestError;
}
