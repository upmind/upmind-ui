// --- internal

import { QueryResponseError } from "src/modules/query";
import type { User, IAuthTransfer } from "../types";

// -----------------------------------------------------------------------------

export interface ClientContext {
  user?: User;
  error?: QueryResponseError;
  transfer?: IAuthTransfer;
}
