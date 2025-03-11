// --- external

// --- internal
import type { ClientItemContext, ClientListingsContext } from "../types";
// -----------------------------------------------------------------------------

export interface CompanyContext extends ClientItemContext {
  addresses?: any;
}
export interface CompaniesContext extends ClientListingsContext {}
