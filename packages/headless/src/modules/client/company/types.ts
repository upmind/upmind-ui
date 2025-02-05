// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";
import type { ClientItemContext, ClientListingsContext } from "../types";
import type { ActorRef } from "xstate";
import { useClientAddresses } from "../address";
// -----------------------------------------------------------------------------

export interface CompanyContext extends ClientItemContext {
  addresses?: any;
}
export interface CompaniesContext extends ClientListingsContext {}
