// --- internal

import type { Client, IAuthTransfer } from "../types";
import type { ResponseError } from "../../../utils";
import type { IPhoneData } from "../../client/phone/types";

// -----------------------------------------------------------------------------

export interface ClientContext {
  client?: Client;
  error?: ResponseError;
  transfer?: IAuthTransfer;
}

export type CompleteRegistrationModel = {
  customFields?: Record<string, unknown>;
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  phone?: IPhoneData;
};
