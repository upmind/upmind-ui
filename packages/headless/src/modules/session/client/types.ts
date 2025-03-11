// --- internal
import type { User } from "../types";

// ---
// Contexts

export interface ClientContext {
  user?: User;
  error?: any;
  transfer?: string | null;
}
