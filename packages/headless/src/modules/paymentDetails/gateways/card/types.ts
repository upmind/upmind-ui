// --- external

// --- types
import type { GatewayCardData } from "@upmind-automation/types";
import { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

export interface GatewayCardContext extends GatewayContext {
  model: GatewayCardData;
  paymentDetails?: GatewayCardData; // will contain the response from Card, as wel las any model data
}
