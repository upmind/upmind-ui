// --- internal

import { QueryResponseError } from "../../query";

// -----------------------------------------------------------------------------

export interface RecaptchaContext {
  siteKey: string;
  grecaptcha?: any;
  token?: string;
  created?: Date;
  // ---
  error?: QueryResponseError;
}
