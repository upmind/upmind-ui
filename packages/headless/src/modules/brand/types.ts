// --- internal
import type { RequestError } from "..//api/types";
import type {
  IBrand,
  BrandConfigKeys,
  OrgFeatureKeys,
  IBrandSettings,
} from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface BrandContext extends IBrandSettings {
  keys: {
    organisation: OrgFeatureKeys[];
    config: any; //BrandConfigKeys[];
  };
  // ---
  modules?: Record<string, any>;
  config?: BrandConfigKeys;
  organisation?: OrgFeatureKeys;
  initialised?: boolean;
  error?: any;
}
