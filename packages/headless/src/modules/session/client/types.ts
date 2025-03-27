// --- internal
import type { User } from "../types";

// -----------------------------------------------------------------------------

export interface ClientContext {
  user?: User;
  error?: any;
  transfer?: string | null;
}
