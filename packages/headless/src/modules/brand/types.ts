// --- internal
import type {
  BrandConfigKeys,
  OrgFeatureKeys,
  IBrandSettings,
} from "@upmind-automation/types";
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

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
  error?: ResponseError;
}
