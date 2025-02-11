// --- internal
import type { RequestError } from "..//api/types";
import type { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface BrandContext {
  keys: {
    organisation: any; //OrgFeatureKeys[];
    config: any; //BrandConfigKeys[];
  };

  modules?: Record<string, any>;
  error?: any;
}
