// --- external

// --- types
import type { GatewayCardData } from "@upmind-automation/types";
import { type GatewayContext } from "../types";

// -----------------------------------------------------------------------------

export type GatewayCardContext = GatewayContext<{
  model: GatewayCardData;
  paymentDetail?: GatewayCardData; // will contain the response from Card, as wel las any model data
}>;
