// --- internal

import type { Client, IAuthTransfer } from "../types";
import type { ResponseError } from "../../../utils";

// -----------------------------------------------------------------------------

export interface ClientContext {
  client?: Client;
  error?: ResponseError;
  transfer?: IAuthTransfer;
}
