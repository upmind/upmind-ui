// --- internal
import type { RequestError } from "../../api/types";

// ---
// Contexts

export interface ClientContext {
  // TODO:
  // user: User;
  // error?: RequestError;
  user: any;
  error?: any;
  transfer?: string | null;
}
