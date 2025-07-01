// --- internal

import type { User, IAuthTransfer } from "../types";
import type { ResponseError } from "../../../utils";

// -----------------------------------------------------------------------------

export interface ClientContext {
  user?: User;
  error?: ResponseError;
  transfer?: IAuthTransfer;
}
