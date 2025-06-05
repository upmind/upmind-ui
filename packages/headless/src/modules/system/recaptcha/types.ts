// --- internal

import { QueryResponseError } from "src/modules/query";

// -----------------------------------------------------------------------------

export interface RecaptchaContext {
  siteKey: string;
  grecaptcha?: any;
  token?: string;
  created?: Date;
  // ---
  error?: QueryResponseError;
}
