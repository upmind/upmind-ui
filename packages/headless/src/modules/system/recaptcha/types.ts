// --- internal

// -----------------------------------------------------------------------------

import type { ResponseError } from "../../../utils";

export interface RecaptchaContext {
  siteKey: string;
  grecaptcha?: any;
  token?: string;
  created?: Date;
  // ---
  error?: ResponseError;
}
