// --- internal

import { ResponseError } from "src/modules/query";
import type { User, IAuthTransfer } from "../types";

// -----------------------------------------------------------------------------

export interface ClientContext {
  user?: User;
  error?: ResponseError;
  transfer?: IAuthTransfer;
}
