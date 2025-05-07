// --- internal

import type { User, IAuthTransfer } from "../types";

// -----------------------------------------------------------------------------

export interface ClientContext {
  user?: User;
  error?: any;
  transfer?: IAuthTransfer;
}
